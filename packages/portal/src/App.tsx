import './i18n';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';

const App = () => {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
};

export default App;
