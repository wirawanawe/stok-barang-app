"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Save, ArrowLeft, Upload, X, Image } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Location {
  id: number;
  name: string;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  category_id: string;
  location_id: string;
  quantity: string;
  unit: string;
  price: string;
  min_stock: string;
  max_stock: string;
}

export default function NewItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    code: "",
    name: "",
    description: "",
    category_id: "",
    location_id: "",
    quantity: "0",
    unit: "",
    price: "0",
    min_stock: "0",
    max_stock: "1000",
  });

  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      const data = await response.json();
      if (data.data) {
        setLocations(data.data);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate each file
    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`${file.name} bukan file gambar`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} terlalu besar. Maksimal 5MB`);
        return;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target?.result as string);
        if (previews.length === validFiles.length) {
          setImagePreviews((prev) => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImageFiles((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((file, index) => {
          formData.append(`images`, file);
        });

        const uploadResponse = await fetch("/api/upload/items", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          imageUrls = uploadData.data.urls;
        } else {
          throw new Error(uploadData.message);
        }
      }

      const payload = {
        ...formData,
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : null,
        location_id: formData.location_id
          ? parseInt(formData.location_id)
          : null,
        quantity: parseInt(formData.quantity) || 0,
        price: parseFloat(formData.price) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        max_stock: parseInt(formData.max_stock) || 1000,
        images: imageUrls,
      };

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/dashboard/items");
      } else {
        const error = await response.json();
        alert(error.error || "Gagal menambahkan barang");
      }
    } catch (error) {
      console.error("Error creating item:", error);
      alert("Terjadi kesalahan saat menambahkan barang");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard/items"
                className="text-emerald-600 hover:text-emerald-800 mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Package className="h-8 w-8 text-emerald-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Tambah Barang Baru
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-8 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Informasi Barang
            </h2>
            <p className="text-gray-600">
              Lengkapi form dibawah untuk menambahkan barang baru ke dalam
              sistem
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kode Barang *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: BRG001"
                  value={formData.code}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Kode unik untuk identifikasi barang
                </p>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nama Barang *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nama barang"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Deskripsi
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Deskripsi barang (opsional)"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Category and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Kategori
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.category_id}
                  onChange={handleInputChange}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="location_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Lokasi
                </label>
                <select
                  id="location_id"
                  name="location_id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.location_id}
                  onChange={handleInputChange}
                >
                  <option value="">Pilih Lokasi</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stock Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Informasi Stok
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Jumlah Stok Awal
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="unit"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Satuan *
                  </label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: Pcs, Unit, Kg, Box"
                    value={formData.unit}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Harga per Satuan
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <label
                    htmlFor="min_stock"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    id="min_stock"
                    name="min_stock"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Batas minimum untuk peringatan stok menipis
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="max_stock"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Stok Maksimum
                  </label>
                  <input
                    type="number"
                    id="max_stock"
                    name="max_stock"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.max_stock}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Batas maksimum kapasitas stok
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <Image className="h-5 w-5 inline mr-2" />
                Gambar Barang
              </h3>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <label className="cursor-pointer">
                    <span className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Pilih gambar
                    </span>
                    <span className="text-gray-600">
                      {" "}
                      atau drag & drop di sini
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF hingga 5MB per file
                  </p>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Preview Gambar ({imagePreviews.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="border-t pt-8 flex justify-end space-x-4">
              <Link
                href="/dashboard/items"
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 flex items-center transition-all duration-200"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Simpan Barang
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
