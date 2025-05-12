import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    location: "",
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/properties");
        // Filter out sold properties, only show available ones
        const availableProperties = res.data.filter(property => property.status === "available");
        setProperties(availableProperties);
        setLoading(false);
      } catch (err) {
        setError("Error fetching properties");
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const filteredProperties = properties.filter((property) => {
    // Make sure we only include available properties
    if (property.status !== "available") return false;
    
    if (filters.minPrice && property.price < Number(filters.minPrice))
      return false;
    if (filters.maxPrice && property.price > Number(filters.maxPrice))
      return false;
    if (
      filters.location &&
      !property.location.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Filter Properties
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Price (ETH)
              </label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="input"
                placeholder="Min Price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Price (ETH)
              </label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="input"
                placeholder="Max Price"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="input"
                placeholder="Enter location"
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Available Properties
          </h2>
          <p className="text-lg text-gray-600">
            Browse through our collection of available properties
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No available properties match your filters.</p>
            <button 
              onClick={() => setFilters({ minPrice: "", maxPrice: "", location: "" })}
              className="mt-4 btn btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property, index) => (
              <div
                key={property._id}
                className="card group transform transition-all duration-300 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  <img
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    src={
                      property.images[0] ||
                      "https://via.placeholder.com/400x300"
                    }
                    alt={property.title}
                  />
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Available
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {property.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{property.location}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary-600">
                      {property.price} ETH
                    </span>
                    <Link
                      to={`/properties/${property._id}`}
                      className="btn btn-primary"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Properties;
