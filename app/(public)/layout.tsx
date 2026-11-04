import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SplashScreen from "@/components/SplashScreen";
import WaveBackground from "@/components/WaveBackground";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SplashScreen />
      <WaveBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
