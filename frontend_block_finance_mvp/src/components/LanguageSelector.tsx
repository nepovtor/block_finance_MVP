import { Language, t } from '../i18n/translations';

type LanguageSelectorProps = {
  selectedLanguage: Language;
  onSelect: (lang: Language) => void;
};

export default function LanguageSelector({
  selectedLanguage,
  onSelect,
}: LanguageSelectorProps) {
  const languages: Language[] = ['en', 'ru'];

  return (
    <div className="flex flex-col gap-3">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          className={`rounded-2xl px-6 py-4 text-base font-semibold transition-all min-h-14 ${
            selectedLanguage === lang
              ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10'
          }`}
        >
          {t(lang === 'en' ? 'english' : 'russian', 'en')}
        </button>
      ))}
    </div>
  );
}
