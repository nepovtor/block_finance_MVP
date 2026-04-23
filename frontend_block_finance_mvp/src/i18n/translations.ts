export type Language = 'en' | 'ru';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    selectLanguage: 'Select Language',
    continue: 'Continue',
    english: 'English',
    russian: 'Русский',
  },
  ru: {
    selectLanguage: 'Выберите язык',
    continue: 'Продолжить',
    english: 'English',
    russian: 'Русский',
  },
};

export function t(key: string, language: Language): string {
  return translations[language][key] || key;
}
