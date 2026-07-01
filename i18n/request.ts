import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import enMessages from '../messages/en.json';
import frMessages from '../messages/fr.json';

const messagesMap = {
  en: enMessages,
  fr: frMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  const messages = messagesMap[locale as keyof typeof messagesMap] ?? messagesMap[routing.defaultLocale];

  return {
    locale,
    messages,
  };
});
