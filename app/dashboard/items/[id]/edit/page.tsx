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

interface Item {
  id: number;
  code: string;
  name: string;
  description: string;
  category_id: number;
  location_id: number;
  quantity: number;
  unit: string;
  price: number;
  min_stock: number;
  max_stock: number;
  images: string;
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

export default function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [itemId, setItemId] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
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
    const initializeParams = async () => {
      const { id } = await params;
      setItemId(id);
      fetchItem(id);
      fetchCategories();
      fetchLocations();
    };
    initializeParams();
  }, []);

  const fetchItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`);
      if (response.ok) {
        const data = await response.json();
        const item: Item = data.data;

        setFormData({
          code: item.code,
          name: item.name,
          description: item.description || "",
          category_id: item.category_id?.toString() || "",
          location_id: item.location_id?.toString() || "",
          quantity: item.quantity.toString(),
          unit: item.unit,
          price: item.price.toString(),
          min_stock: item.min_stock.toString(),
          max_stock: item.max_stock.toString(),
        });

        // Parse existing images
        try {
          const images = JSON.parse(item.images || "[]");
          setExistingImages(images);
        } catch (error) {
          console.error("Error parsing images:", error);
          setExistingImages([]);
        }
      } else {
        alert("Barang tidak ditemukan");
        router.push("/dashboard/items");
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      alert("Terjadi kesalahan saat mengambil data barang");
    } finally {
      setFetchLoading(false);
    }
  };

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

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload new images first
      let newImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const formDataImages = new FormData();
        imageFiles.forEach((file) => {
          formDataImages.append(`images`, file);
        });

        const uploadResponse = await fetch("/api/upload/items", {
          method: "POST",
          body: formDataImages,
        });

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          // Extract just the filename from the URLs
          newImageUrls = uploadData.data.urls.map((url: string) =>
            url.replace("/uploads/items/", "")
          );
        } else {
          throw new Error(uploadData.message);
        }
      }

      // Combine existing images with new images
      const allImages = [...existingImages, ...newImageUrls];

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
        images: allImages,
      };

      const response = await fetch(`/api/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/dashboard/items");
      } else {
        const error = await response.json();
        alert(error.error || "Gagal mengupdate barang");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Terjadi kesalahan saat mengupdate barang");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                href="/dashboard/items"
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Edit Barang</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Edit Informasi Barang
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Update informasi barang sesuai kebutuhan
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Jumlah Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    min="0"
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                Gambar Produk
              </h3>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Gambar Saat Ini ({existingImages.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={`/uploads/items/${image}`}
                            alt={`Gambar ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTMwVjcwTTgwIDEwMEgxMjAiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+";
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Klik untuk memilih gambar atau drag & drop
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  PNG, JPG, JPEG hingga 5MB
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  Pilih Gambar
                </label>
              </div>

              {/* New Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Gambar Baru ({imagePreviews.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="border-t pt-6 flex justify-end space-x-3">
              <Link
                href="/dashboard/items"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Barang
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
