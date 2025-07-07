"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Users,
  Facebook,
  Instagram,
  MessageCircle,
  Upload,
  Image,
} from "lucide-react";

interface WebsiteSettings {
  [key: string]: {
    value: string;
    type: string;
    description: string;
  };
}

export default function WebsiteSettingsPage() {
  const [settings, setSettings] = useState<WebsiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [sliderFiles, setSliderFiles] = useState<{
    [key: string]: File | null;
  }>({});
  const [sliderPreviews, setSliderPreviews] = useState<{
    [key: string]: string;
  }>({});

  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/dashboard/login");
      return;
    }

    if (isAuthenticated && user?.role === "admin") {
      fetchSettings();
    }
  }, [isAuthenticated, user, isLoading]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/website-settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Gagal memuat pengaturan website");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran file maksimal 2MB");
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSliderChange = (
    slideIndex: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Ukuran file maksimal 10MB");
        return;
      }

      setSliderFiles((prev) => ({
        ...prev,
        [slideIndex]: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSliderPreviews((prev) => ({
          ...prev,
          [slideIndex]: e.target?.result as string,
        }));
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("auth-token");

      // Upload logo first if there's a new logo file
      let logoUrl = settings.site_logo?.value || "";
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);

        const logoResponse = await fetch("/api/upload/logo", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const logoData = await logoResponse.json();
        if (logoData.success) {
          logoUrl = logoData.data.url;
        } else {
          throw new Error(logoData.message);
        }
      }

      // Upload slider images if there are new files
      const sliderUrls: { [key: string]: string } = {};
      for (const [slideIndex, file] of Object.entries(sliderFiles)) {
        if (file) {
          const formData = new FormData();
          formData.append("file", file);

          const sliderResponse = await fetch("/api/upload/slider", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const sliderData = await sliderResponse.json();
          if (sliderData.success) {
            sliderUrls[slideIndex] = sliderData.data.url;
          } else {
            throw new Error(sliderData.message);
          }
        }
      }

      const settingsData: Record<string, string> = {};

      // Convert settings to simple key-value pairs
      Object.entries(settings).forEach(([key, setting]) => {
        settingsData[key] = setting.value;
      });

      // Update logo URL
      settingsData.site_logo = logoUrl;

      // Update slider image URLs
      Object.entries(sliderUrls).forEach(([slideIndex, url]) => {
        settingsData[`slider_image_${slideIndex}`] = url;
      });

      const response = await fetch("/api/website-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setLogoFile(null);
        setLogoPreview("");
        setSliderFiles({});
        setSliderPreviews({});
        fetchSettings(); // Refresh settings
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Terjadi kesalahan saat menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-gray-600">Memuat pengaturan...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-emerald-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Pengaturan Website
              </h1>
              <p className="text-gray-600 mt-1">
                Kelola informasi dasar website dan kontak
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Website Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <Globe className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Informasi Website
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Website
                </label>
                <input
                  type="text"
                  value={settings.site_title?.value || ""}
                  onChange={(e) =>
                    handleInputChange("site_title", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nama website Anda"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.site_title?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Judul Website
                </label>
                <input
                  type="text"
                  value={settings.site_subtitle?.value || ""}
                  onChange={(e) =>
                    handleInputChange("site_subtitle", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tagline atau deskripsi singkat"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.site_subtitle?.description}
                </p>
              </div>

              {/* Logo Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Image className="h-4 w-4 inline mr-1" />
                  Logo Website
                </label>

                {/* Current Logo */}
                {(settings.site_logo?.value || logoPreview) && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Logo saat ini:</p>
                    <img
                      src={logoPreview || settings.site_logo?.value}
                      alt="Logo"
                      className="h-16 w-auto object-contain border border-gray-200 rounded-lg p-2"
                    />
                  </div>
                )}

                {/* Upload Input */}
                <div className="flex items-center space-x-4">
                  <label className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm text-gray-600">
                      {logoFile ? logoFile.name : "Pilih Logo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>

                  {logoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview("");
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Format: JPG, PNG, GIF. Maksimal 2MB. Rekomendasi ukuran:
                  200x60px
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tentang Kami
                </label>
                <textarea
                  rows={4}
                  value={settings.about_us?.value || ""}
                  onChange={(e) =>
                    handleInputChange("about_us", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Deskripsi tentang perusahaan atau toko Anda"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.about_us?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <Phone className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Informasi Kontak
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={settings.contact_phone?.value || ""}
                  onChange={(e) =>
                    handleInputChange("contact_phone", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={settings.contact_email?.value || ""}
                  onChange={(e) =>
                    handleInputChange("contact_email", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="info@website.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Alamat Lengkap
                </label>
                <textarea
                  rows={3}
                  value={settings.contact_address?.value || ""}
                  onChange={(e) =>
                    handleInputChange("contact_address", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Alamat lengkap toko atau kantor"
                />
              </div>
            </div>
          </div>

          {/* Slider Management */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <Image className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Pengaturan Slider
              </h2>
            </div>

            <div className="space-y-8">
              {[1, 2, 3].map((slideNumber) => (
                <div
                  key={slideNumber}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Slide {slideNumber}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Slide {slideNumber}
                      </label>

                      {/* Current Image */}
                      {(settings[`slider_image_${slideNumber}`]?.value ||
                        sliderPreviews[slideNumber.toString()]) && (
                        <div className="mb-4">
                          <img
                            src={
                              sliderPreviews[slideNumber.toString()] ||
                              settings[`slider_image_${slideNumber}`]?.value
                            }
                            alt={`Slide ${slideNumber}`}
                            className="w-full h-32 object-cover border border-gray-200 rounded-lg"
                          />
                        </div>
                      )}

                      {/* Upload Input */}
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                          <Upload className="h-5 w-5 text-gray-600 mr-2" />
                          <span className="text-sm text-gray-600">
                            {sliderFiles[slideNumber.toString()]
                              ? sliderFiles[slideNumber.toString()]?.name
                              : "Pilih Gambar"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleSliderChange(slideNumber.toString(), e)
                            }
                            className="hidden"
                          />
                        </label>

                        {sliderFiles[slideNumber.toString()] && (
                          <button
                            type="button"
                            onClick={() => {
                              setSliderFiles((prev) => ({
                                ...prev,
                                [slideNumber.toString()]: null,
                              }));
                              setSliderPreviews((prev) => ({
                                ...prev,
                                [slideNumber.toString()]: "",
                              }));
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        Format: JPG, PNG, WebP. Maksimal 10MB. Rekomendasi
                        ukuran: 1920x1080px
                      </p>
                    </div>

                    {/* Slide Content */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Judul
                        </label>
                        <input
                          type="text"
                          value={
                            settings[`slider_title_${slideNumber}`]?.value || ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              `slider_title_${slideNumber}`,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Judul slide"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sub Judul
                        </label>
                        <input
                          type="text"
                          value={
                            settings[`slider_subtitle_${slideNumber}`]?.value ||
                            ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              `slider_subtitle_${slideNumber}`,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Sub judul slide"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deskripsi
                        </label>
                        <textarea
                          rows={3}
                          value={
                            settings[`slider_description_${slideNumber}`]
                              ?.value || ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              `slider_description_${slideNumber}`,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Deskripsi slide"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teks Tombol
                        </label>
                        <input
                          type="text"
                          value={
                            settings[`slider_cta_${slideNumber}`]?.value || ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              `slider_cta_${slideNumber}`,
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Teks tombol CTA"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-emerald-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                Media Sosial
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Facebook className="h-4 w-4 inline mr-1" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={settings.social_facebook?.value || ""}
                  onChange={(e) =>
                    handleInputChange("social_facebook", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Instagram className="h-4 w-4 inline mr-1" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={settings.social_instagram?.value || ""}
                  onChange={(e) =>
                    handleInputChange("social_instagram", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageCircle className="h-4 w-4 inline mr-1" />
                  WhatsApp
                </label>
                <input
                  type="url"
                  value={settings.social_whatsapp?.value || ""}
                  onChange={(e) =>
                    handleInputChange("social_whatsapp", e.target.value)
                  }
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://wa.me/628123456789"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
