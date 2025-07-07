"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  Star,
  Truck,
  Shield,
  Award,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Package,
  Users,
  Factory,
  Palette,
  User,
  LogOut,
} from "lucide-react";
import { useCustomerAuth } from "@/lib/customer-auth-context";
import { FeatureGuard } from "@/lib/feature-context";

interface FabricCategory {
  id: string;
  name: string;
  description: string;
  image: string;
  types: string[];
}

const fabricCategories: FabricCategory[] = [
  {
    id: "cotton-combed",
    name: "Cotton Combed",
    description: "Kain berkualitas premium dengan tekstur halus",
    image: "/api/placeholder/300/200",
    types: ["16s", "18s", "20s", "24s", "28s", "30s", "40s"],
  },
  {
    id: "cotton-carded",
    name: "Cotton Carded",
    description: "Kain cotton berkualitas dengan harga terjangkau",
    image: "/api/placeholder/300/200",
    types: ["24s", "30s"],
  },
  {
    id: "cvc",
    name: "CVC",
    description: "Kombinasi Cotton dan Polyester yang nyaman",
    image: "/api/placeholder/300/200",
    types: ["20s", "24s", "30s"],
  },
  {
    id: "polyester",
    name: "Polyester",
    description: "Bahan tahan lama dan mudah perawatan",
    image: "/api/placeholder/300/200",
    types: ["Active Dry", "Quick Dry", "Moisture Wicking"],
  },
];

const features = [
  {
    icon: Factory,
    title: "Produksi Sendiri",
    description:
      "Diproduksi langsung di pabrik kami dengan kontrol kualitas ketat",
  },
  {
    icon: Award,
    title: "Kualitas Premium",
    description:
      "Menggunakan bahan berkualitas tinggi dengan standar internasional",
  },
  {
    icon: Package,
    title: "500+ Jenis Kain",
    description:
      "Koleksi lengkap berbagai jenis kain untuk kebutuhan tekstil Anda",
  },
  {
    icon: Palette,
    title: "100+ Pilihan Warna",
    description:
      "Tersedia berbagai pilihan warna dengan custom color pre-order",
  },
  {
    icon: Truck,
    title: "Pengiriman Cepat",
    description:
      "Sistem distribusi ke seluruh Indonesia dengan pengiriman terpercaya",
  },
  {
    icon: Users,
    title: "10.000+ Pelanggan",
    description: "Dipercaya oleh ribuan brand dan pengusaha konveksi",
  },
];

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [websiteInfo, setWebsiteInfo] = useState<any>(null);
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { customer, isAuthenticated, logout } = useCustomerAuth();

  useEffect(() => {
    fetchWebsiteInfo();
  }, []);

  const fetchWebsiteInfo = async () => {
    try {
      const response = await fetch("/api/public/website-info");
      const data = await response.json();
      if (data.success) {
        setWebsiteInfo(data.data);
      }
    } catch (error) {
      console.error("Error fetching website info:", error);
    }
  };

  const getHeroSlides = () => {
    if (!websiteInfo?.settings) {
      return [
        {
          title: "Selamat Datang di Sistem Stok Kain Modern",
          subtitle: "Pelopor Manajemen Stok Kain Terdepan di Indonesia",
          description:
            "Kelola stok kain Anda dengan mudah dan efisien menggunakan sistem terdepan",
          cta: "Mulai Kelola Stok",
          image: "",
          background: "bg-gradient-to-r from-emerald-600 to-teal-600",
        },
        {
          title: "Manajemen Stok yang Efisien",
          subtitle: "Teknologi Canggih untuk Bisnis Tekstil Anda",
          description:
            "Pantau stok real-time, kelola transaksi, dan buat laporan dengan mudah",
          cta: "Pelajari Fitur",
          image: "",
          background: "bg-gradient-to-r from-teal-600 to-cyan-600",
        },
        {
          title: "Solusi Terpadu untuk Bisnis Kain",
          subtitle: "Dari Stok Hingga Laporan dalam Satu Platform",
          description:
            "Integrasikan semua kebutuhan manajemen stok kain dalam satu sistem",
          cta: "Lihat Demo",
          image: "",
          background: "bg-gradient-to-r from-slate-600 to-gray-600",
        },
      ];
    }

    return [1, 2, 3].map((slideNumber) => ({
      title:
        websiteInfo.settings[`slider_title_${slideNumber}`] ||
        `Slide ${slideNumber}`,
      subtitle: websiteInfo.settings[`slider_subtitle_${slideNumber}`] || "",
      description:
        websiteInfo.settings[`slider_description_${slideNumber}`] || "",
      cta:
        websiteInfo.settings[`slider_cta_${slideNumber}`] ||
        "Pelajari Lebih Lanjut",
      image: websiteInfo.settings[`slider_image_${slideNumber}`] || "",
      background:
        slideNumber === 1
          ? "bg-gradient-to-r from-emerald-600 to-teal-600"
          : slideNumber === 2
          ? "bg-gradient-to-r from-teal-600 to-cyan-600"
          : "bg-gradient-to-r from-slate-600 to-gray-600",
    }));
  };

  const heroSlides = getHeroSlides();

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlayPaused || isTransitioning) return;

    const timer = setInterval(() => {
      const nextIndex = (currentSlide + 1) % 3;
      changeSlide(nextIndex);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlayPaused, isTransitioning, currentSlide]); // Depend on pause state and transition

  // Pause auto-play temporarily when user interacts
  const handleUserInteraction = () => {
    setIsAutoPlayPaused(true);
    setTimeout(() => {
      setIsAutoPlayPaused(false);
    }, 10000); // Resume after 10 seconds of no interaction
  };

  // Animated slide transition
  const changeSlide = (newSlideIndex: number) => {
    if (isTransitioning || newSlideIndex === currentSlide) return;

    setIsTransitioning(true);

    // Start fade out
    setTimeout(() => {
      setCurrentSlide(newSlideIndex);
      // End transition after fade in completes
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300);
  };

  // Manual navigation with pause
  const goToSlide = (index: number) => {
    changeSlide(index);
    handleUserInteraction();
  };

  const goToPrevSlide = () => {
    const prevIndex = (currentSlide - 1 + 3) % 3;
    changeSlide(prevIndex);
    handleUserInteraction();
  };

  const goToNextSlide = () => {
    const nextIndex = (currentSlide + 1) % 3;
    changeSlide(nextIndex);
    handleUserInteraction();
  };

  return (
    <FeatureGuard featureKey="homepage" pageKey="homepage" userRole="user">
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {websiteInfo?.settings?.site_logo ? (
                    <img
                      src={websiteInfo.settings.site_logo}
                      alt={websiteInfo.settings.site_title || "Logo"}
                      className="h-10 w-auto"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-emerald-600">
                      {websiteInfo?.settings?.site_title || "StokKain"}
                    </h1>
                  )}
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    <a
                      href="#home"
                      className="text-gray-900 hover:text-[#ff1717] px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Beranda
                    </a>
                    <a
                      href="#products"
                      className="text-gray-700 hover:text-[#ff1717] px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Produk
                    </a>
                    <a
                      href="#features"
                      className="text-gray-700 hover:text-[#ff1717] px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Fitur
                    </a>
                    <a
                      href="#about"
                      className="text-gray-700 hover:text-[#ff1717] px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Tentang
                    </a>
                    <a
                      href="#contact"
                      className="text-gray-700 hover:text-[#ff1717] px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Kontak
                    </a>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="ml-4 flex items-center md:ml-6 space-x-4">
                  <Link
                    href="/shop"
                    className="text-gray-700 hover:text-[#ff1717] px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Belanja
                  </Link>

                  {/* Cart */}

                  {/* User Menu */}
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <span className="text-sm text-gray-700">
                          {customer?.full_name}
                        </span>
                      </div>
                      <button
                        onClick={logout}
                        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Logout"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Link
                        href="/customer/login"
                        className="bg-[#ff1717] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Masuk
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 hover:text-[#ff1717] p-2"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
                <a
                  href="#home"
                  className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Beranda
                </a>
                <a
                  href="#products"
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Produk
                </a>
                <a
                  href="#features"
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Fitur
                </a>
                <a
                  href="#about"
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Tentang
                </a>
                <a
                  href="#contact"
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Kontak
                </a>
                <div className="border-t pt-4">
                  <Link
                    href="/shop"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Belanja
                  </Link>
                  <Link
                    href="/cart"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  >
                    Keranjang
                  </Link>

                  {/* User Menu Mobile */}
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="flex items-center px-3 py-2">
                        <User className="h-5 w-5 text-gray-600 mr-2" />
                        <span className="text-gray-700 font-medium">
                          {customer?.full_name}
                        </span>
                      </div>
                      <button
                        onClick={logout}
                        className="text-red-600 hover:text-red-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/customer/login"
                        className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                      >
                        Masuk
                      </Link>
                      <Link
                        href="/customer/register"
                        className="bg-blue-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
                      >
                        Daftar
                      </Link>
                    </div>
                  )}

                  <Link
                    href="/dashboard"
                    className="bg-gray-600 text-white block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-700 transition-colors mt-2"
                  >
                    Dashboard Admin
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section - Full Screen Slider */}
        <section
          id="home"
          className="relative h-screen overflow-hidden"
          onMouseEnter={() => setIsAutoPlayPaused(true)}
          onMouseLeave={() => setIsAutoPlayPaused(false)}
        >
          {/* Background Layer with Smooth Transition */}
          <div
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
            }`}
          >
            {heroSlides[currentSlide].image ? (
              // Image background
              <div className="relative h-full w-full">
                <img
                  src={heroSlides[currentSlide].image}
                  alt={heroSlides[currentSlide].title}
                  className={`h-full w-full object-cover transition-transform duration-700 ease-in-out ${
                    isTransitioning ? "scale-110" : "scale-100"
                  }`}
                />
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-700"></div>
              </div>
            ) : (
              // Gradient background fallback
              <div
                className={`h-full w-full ${heroSlides[currentSlide].background} transition-all duration-700 ease-in-out`}
              ></div>
            )}
          </div>

          {/* Content overlay */}
          <div className="relative h-full flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div
                className={`text-white transition-all duration-700 ease-in-out ${
                  isTransitioning
                    ? "opacity-0 translate-y-8"
                    : "opacity-100 translate-y-0"
                }`}
              >
                <h1
                  className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 drop-shadow-lg transition-all duration-700 ease-in-out delay-100 ${
                    isTransitioning
                      ? "opacity-0 translate-y-12"
                      : "opacity-100 translate-y-0"
                  }`}
                >
                  {heroSlides[currentSlide].title}
                </h1>
                {heroSlides[currentSlide].subtitle && (
                  <p
                    className={`text-xl md:text-2xl lg:text-3xl mb-6 text-opacity-90 drop-shadow-md transition-all duration-700 ease-in-out delay-200 ${
                      isTransitioning
                        ? "opacity-0 translate-y-8"
                        : "opacity-100 translate-y-0"
                    }`}
                  >
                    {heroSlides[currentSlide].subtitle}
                  </p>
                )}
                {heroSlides[currentSlide].description && (
                  <p
                    className={`text-lg md:text-xl mb-8 text-opacity-80 max-w-3xl mx-auto drop-shadow-md transition-all duration-700 ease-in-out delay-300 ${
                      isTransitioning
                        ? "opacity-0 translate-y-8"
                        : "opacity-100 translate-y-0"
                    }`}
                  >
                    {heroSlides[currentSlide].description}
                  </p>
                )}
                <div
                  className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ease-in-out delay-400 ${
                    isTransitioning
                      ? "opacity-0 translate-y-8"
                      : "opacity-100 translate-y-0"
                  }`}
                >
                  <Link
                    href="/dashboard"
                    className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 hover:scale-105 transition-all duration-300 inline-flex items-center justify-center gap-2 shadow-lg"
                  >
                    {heroSlides[currentSlide].cta}
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/shop"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-gray-900 hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Lihat Produk
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation arrows
        <button
          onClick={goToPrevSlide}
          disabled={isTransitioning}
          className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 hover:scale-110 text-white p-3 rounded-full transition-all duration-300 ${
            isTransitioning ? "opacity-50 cursor-not-allowed" : "opacity-100"
          }`}
          aria-label="Previous slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={goToNextSlide}
          disabled={isTransitioning}
          className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 hover:scale-110 text-white p-3 rounded-full transition-all duration-300 ${
            isTransitioning ? "opacity-50 cursor-not-allowed" : "opacity-100"
          }`}
          aria-label="Next slide"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button> */}

          {/* Slide indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 ${
                  currentSlide === index
                    ? "bg-white scale-110 shadow-lg animate-pulse-glow"
                    : "bg-white bg-opacity-50 hover:bg-opacity-75"
                } ${
                  isTransitioning
                    ? "opacity-50 cursor-not-allowed"
                    : "opacity-100"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Auto-play indicator (optional - for debugging)
        {process.env.NODE_ENV === "development" && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            Auto-play: {isAutoPlayPaused ? "Paused" : "Playing"}
          </div>
        )} */}
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Mengapa Memilih Sistem Stok Kain Kami?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Kami berkomitmen memberikan solusi terbaik untuk manajemen stok
                kain Anda
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 ml-4">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Kelola Berbagai Jenis Kain
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Sistem kami mendukung manajemen stok untuk berbagai jenis kain
                berkualitas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {fabricCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Package className="h-16 w-16 text-blue-600" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {category.types.slice(0, 3).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full"
                        >
                          {type}
                        </span>
                      ))}
                      {category.types.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{category.types.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Mulai Kelola Stok Kain Anda Hari Ini
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan bisnis tekstil yang telah mempercayai
              sistem kami
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"
              >
                Mulai Sekarang
                <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Masuk ke Akun
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold mb-4">StokKain</h3>
                <p className="text-gray-300 mb-6 max-w-md">
                  Sistem manajemen stok kain modern yang membantu bisnis tekstil
                  Anda tumbuh dengan efisien dan terorganisir.
                </p>
                <div className="flex space-x-4">
                  <div className="flex items-center text-gray-300">
                    <Phone className="h-5 w-5 mr-2" />
                    <span>+62 123 456 789</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Mail className="h-5 w-5 mr-2" />
                    <span>info@stokkain.com</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Fitur Utama</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>Manajemen Stok</li>
                  <li>Tracking Barang</li>
                  <li>Laporan Real-time</li>
                  <li>Multi User</li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Dukungan</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>Panduan Pengguna</li>
                  <li>Video Tutorial</li>
                  <li>Customer Support</li>
                  <li>FAQ</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-300">
              <p>&copy; 2025 StokKain. Semua hak dilindungi.</p>
            </div>
          </div>
        </footer>
      </div>
    </FeatureGuard>
  );
}
