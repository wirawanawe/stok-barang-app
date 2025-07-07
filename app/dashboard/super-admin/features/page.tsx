"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Sliders,
  ToggleLeft,
  ToggleRight,
  Plus,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

interface FeatureToggle {
  id: number;
  feature_key: string;
  feature_name: string;
  description: string;
  is_enabled: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function SuperAdminFeaturesPage() {
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const { user, isSuperAdmin } = useAuth();
  const router = useRouter();

  // Redirect if not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      router.push("/dashboard");
    }
  }, [isSuperAdmin, router]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchFeatures();
    }
  }, [isSuperAdmin]);

  const fetchFeatures = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch("/api/super-admin/features", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFeatures(data.data);
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to fetch features" });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, currentState: boolean) => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch("/api/super-admin/features", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feature_key: featureKey,
          is_enabled: !currentState,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        await fetchFeatures(); // Refresh the list
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update feature" });
    }
  };

  const createFeature = async (formData: any) => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch("/api/super-admin/features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setShowCreateModal(false);
        await fetchFeatures();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to create feature" });
    }
  };

  // Filter features based on search and category
  const filteredFeatures = features.filter((feature) => {
    const matchesSearch =
      feature.feature_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.feature_key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || feature.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...new Set(features.map((f) => f.category))];

  if (!isSuperAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <Sliders className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Feature Toggles
                </h1>
                <p className="text-gray-600">
                  Manage system features and functionality
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center">
              {message.type === "success" ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "all"
                      ? "All Categories"
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading features...</p>
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="p-8 text-center">
              <Sliders className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No features found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-medium text-gray-900 mr-3">
                          {feature.feature_name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            feature.category === "core"
                              ? "bg-blue-100 text-blue-800"
                              : feature.category === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : feature.category === "ecommerce"
                              ? "bg-green-100 text-green-800"
                              : feature.category === "export"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {feature.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Key:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {feature.feature_key}
                        </code>
                      </p>
                      {feature.description && (
                        <p className="text-sm text-gray-600">
                          {feature.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() =>
                          toggleFeature(feature.feature_key, feature.is_enabled)
                        }
                        className={`flex items-center p-2 rounded-lg transition-colors ${
                          feature.is_enabled
                            ? "bg-green-100 hover:bg-green-200 text-green-800"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                        }`}
                      >
                        {feature.is_enabled ? (
                          <>
                            <ToggleRight className="h-5 w-5 mr-1" />
                            Enabled
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 mr-1" />
                            Disabled
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Feature Modal */}
      {showCreateModal && (
        <CreateFeatureModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={createFeature}
        />
      )}
    </div>
  );
}

// Create Feature Modal Component
function CreateFeatureModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    feature_key: "",
    feature_name: "",
    description: "",
    category: "general",
    is_enabled: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Create New Feature</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Key
            </label>
            <input
              type="text"
              required
              value={formData.feature_key}
              onChange={(e) =>
                setFormData({ ...formData, feature_key: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., new_feature"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Name
            </label>
            <input
              type="text"
              required
              value={formData.feature_name}
              onChange={(e) =>
                setFormData({ ...formData, feature_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., New Feature"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Feature description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="general">General</option>
              <option value="core">Core</option>
              <option value="admin">Admin</option>
              <option value="ecommerce">eCommerce</option>
              <option value="export">Export</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_enabled"
              checked={formData.is_enabled}
              onChange={(e) =>
                setFormData({ ...formData, is_enabled: e.target.checked })
              }
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="is_enabled" className="ml-2 text-sm text-gray-700">
              Enable feature by default
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Create Feature
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
