"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { GoldButton } from "../ui/GoldButton";
import { useTranslations } from "next-intl";
import { validateRSVP, VALID_CLASSES, VALID_SPECIALTIES, RSVPEntry } from "@/lib/rsvp";

export function RSVPSection() {
  const t = useTranslations("rsvp");
  
  const [formData, setFormData] = useState<Partial<RSVPEntry>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    classe: "",
    specialty: "",
    guestCount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [apiError, setApiError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "guestCount" ? Number(value) : value }));
    // Clear error for the field being typed in
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    // 1. Client-side validation
    const validation = validateRSVP(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      // Scroll to first error conceptually (simple alert or just showing inline is usually enough, but we'll focus the first invalid if possible, or just let the user see them as they are inline).
      return;
    }

    setStatus("loading");
    
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.fields) {
          setErrors(data.fields);
          setStatus("idle");
          return;
        }
        if (response.status === 409) {
          throw new Error("Cet email est déjà inscrit. / This email is already registered.");
        }
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setApiError(err.message || "Failed to submit RSVP.");
    }
  };

  const inputContainerClass = "flex flex-col gap-1.5";
  const labelClass = "font-sans text-[11px] uppercase tracking-[0.12em] text-[#F0B429]";
  const requiredAsterisk = <span className="text-[#E05252] ml-[3px]">*</span>;
  
  const getFieldClass = (name: string) => {
    const base = "w-full px-4 py-[13px] bg-[rgba(255,255,255,0.04)] border rounded-lg font-sans text-[15px] text-[#F5ECD7] outline-none transition-all duration-250 placeholder-[rgba(245,236,215,0.35)] focus:border-[#F0B429] focus:bg-[rgba(255,255,255,0.07)] focus:ring-[3px] focus:ring-[rgba(240,180,41,0.10)]";
    return `${base} ${errors[name] ? "border-[#E05252] ring-[3px] ring-[rgba(224,82,82,0.08)]" : "border-[rgba(240,180,41,0.18)]"}`;
  };

  const selectArrowStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23F0B429' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "40px",
    WebkitAppearance: "none" as const,
  };

  const ErrorMsg = ({ msg }: { msg?: string }) => {
    if (!msg) return null;
    return (
      <div className="flex items-center gap-1 mt-1 text-[#E05252] font-sans text-[12px]">
        <AlertCircle size={12} />
        <span>{msg}</span>
      </div>
    );
  };

  return (
    <section className="relative w-full py-[clamp(80px,10vw,160px)] bg-[#1A1410] overflow-hidden" id="rsvp">
      <div className="w-full max-w-[700px] mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
          }}
        >
          <GlassCard className="p-[40px] border border-[rgba(240,180,41,0.20)]">
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex flex-col items-center text-center py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-[rgba(240,180,41,0.1)] flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-[#F0B429]" />
                  </div>
                  <h3 className="font-display text-[28px] font-bold text-white mb-6">Inscription confirmée !</h3>
                  <div className="w-[60px] h-[1px] bg-[#F0B429] mb-6"></div>
                  <p className="font-sans text-[14px] text-[#F5ECD7] opacity-70 mb-2">
                    Un email avec vos QR codes a été envoyé à
                  </p>
                  <p className="font-sans font-semibold text-[16px] text-[#F0B429] mb-4">
                    {formData.email}
                  </p>
                  <p className="font-sans text-[14px] text-[#F5ECD7] opacity-70 mb-6">
                    Vérifiez votre boîte de réception.
                  </p>
                  
                  {formData.guestCount && formData.guestCount > 0 ? (
                    <p className="font-sans text-[13px] text-[#F5ECD7] opacity-60 max-w-[400px]">
                      Votre email contient {formData.guestCount + 1} QR code(s) — 1 pour vous et {formData.guestCount} pour vos accompagnateur(s).
                    </p>
                  ) : (
                    <p className="font-sans text-[13px] text-[#F5ECD7] opacity-60">
                      Votre email contient 1 QR code pour votre entrée.
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                >
                  <div className="sm:col-span-2 mb-4 text-center">
                    <h2 className="font-display text-3xl sm:text-4xl text-white text-glow-gold">
                      {t("title", { default: "Confirm Your Attendance" })}
                    </h2>
                  </div>

                  {apiError && (
                    <div className="sm:col-span-2 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="font-sans text-sm">{apiError}</span>
                    </div>
                  )}

                  {/* ROW 1 */}
                  <div className={inputContainerClass}>
                    <label className={labelClass}>{t("field.firstName", { default: "Prénom" })}{requiredAsterisk}</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={getFieldClass("firstName")} placeholder={t("placeholder.firstName")} />
                    <ErrorMsg msg={errors.firstName} />
                  </div>
                  <div className={inputContainerClass}>
                    <label className={labelClass}>{t("field.lastName", { default: "Nom" })}{requiredAsterisk}</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={getFieldClass("lastName")} placeholder={t("placeholder.lastName")} />
                    <ErrorMsg msg={errors.lastName} />
                  </div>

                  {/* ROW 2 */}
                  <div className={inputContainerClass}>
                    <label className={labelClass}>{t("field.email", { default: "E-mail" })}{requiredAsterisk}</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={getFieldClass("email")} placeholder={t("placeholder.email")} />
                    <ErrorMsg msg={errors.email} />
                  </div>
                  <div className={inputContainerClass}>
                    <label className={labelClass}>{t("field.phone", { default: "Numéro de téléphone" })}{requiredAsterisk}</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={getFieldClass("phone")} placeholder={t("placeholder.phone")} />
                    <ErrorMsg msg={errors.phone} />
                  </div>

                  {/* ROW 3 */}
                  <div className={inputContainerClass}>
                    <label className={labelClass}>{t("field.classe", { default: "Votre classe" })}{requiredAsterisk}</label>
                    <select name="classe" value={formData.classe} onChange={handleChange} className={getFieldClass("classe")} style={selectArrowStyle}>
                      <option value="" disabled>{t("placeholder.classe", { default: "Sélectionner..." })}</option>
                      {VALID_CLASSES.map(c => <option key={c} value={c} className="bg-[#1A1410]">{c}</option>)}
                    </select>
                    <ErrorMsg msg={errors.classe} />
                  </div>
                  <div className={inputContainerClass}>
                    <label className={labelClass}>{t("field.specialty", { default: "Votre spécialité" })}{requiredAsterisk}</label>
                    <select name="specialty" value={formData.specialty} onChange={handleChange} className={getFieldClass("specialty")} style={selectArrowStyle}>
                      <option value="" disabled>{t("placeholder.specialty", { default: "Sélectionner..." })}</option>
                      {VALID_SPECIALTIES.map(s => <option key={s} value={s} className="bg-[#1A1410]">{s}</option>)}
                    </select>
                    <ErrorMsg msg={errors.specialty} />
                  </div>

                  {/* ROW 4 */}
                  <div className={`sm:col-span-2 ${inputContainerClass}`}>
                    <label className={labelClass}>
                      {t("field.guestCount", { default: "Tu vas ramener combien de personnes avec toi ?" })}
                      {requiredAsterisk}
                      <br/>
                      <span className="text-[10px] text-[#F0B429] opacity-70 tracking-normal normal-case">{t("field.guestCountSub", { default: "(NB: MAX 2 personnes)" })}</span>
                    </label>
                    <select name="guestCount" value={formData.guestCount} onChange={handleChange} className={getFieldClass("guestCount")} style={selectArrowStyle}>
                      {[0,1,2].map(n => <option key={n} value={n} className="bg-[#1A1410]">{n}</option>)}
                    </select>
                    <ErrorMsg msg={errors.guestCount} />
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="sm:col-span-2 mt-2">
                    <GoldButton 
                      type="submit" 
                      variant="primary"
                      disabled={status === "loading"}
                      className="w-full h-[52px] text-[15px] tracking-[0.10em]"
                    >
                      {status === "loading" ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {t("button.submitting", { default: "Envoi en cours..." })}
                        </span>
                      ) : (
                        t("button.submit", { default: "Confirmer ma présence" })
                      )}
                    </GoldButton>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}
