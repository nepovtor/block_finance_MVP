import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import LanguageSelector from '../components/LanguageSelector';
import { Language, t } from '../i18n/translations';

export default function LanguageSelectionPage() {
  const nav = useNavigate();
  const { language, setLanguage } = useAppStore();

  function handleLanguageSelect(lang: Language) {
    setLanguage(lang);
    nav('/');
  }

  return (
    <main className="min-h-screen overflow-x-clip px-4 py-6 text-slate-100 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl items-center sm:min-h-[calc(100vh-4rem)]">
        <section className="glass-panel bg-grid animate-rise-in relative w-full overflow-hidden p-6 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
          <div className="absolute -right-24 top-10 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative space-y-8">
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                {t('selectLanguage', language)}
              </h1>
              <p className="text-slate-300">
                {t('selectLanguageDescription', language)}
              </p>
              <p className="text-sm text-slate-400">
                {t('language.heroTitle', language)}
              </p>
            </div>

            <LanguageSelector
              selectedLanguage={language}
              onSelect={handleLanguageSelect}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
