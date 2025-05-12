import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function Home() {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5001/api/properties?featured=true"
        );
        setFeaturedProperties(res.data.slice(0, 3));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching featured properties:", err);
        setLoading(false);
      }
    };

    fetchFeaturedProperties();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden w-full">
        <div className="flex flex-col lg:flex-row w-full min-h-[500px] lg:min-h-[600px] xl:min-h-[700px]">
          {/* Left: Text Content */}
          <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:py-0">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Find your dream</span>
              <span className="block text-blue-600">
                property with blockchain
              </span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl md:mt-5 md:text-xl">
              Secure property transactions using blockchain technology. Buy and
              sell properties with confidence using our decentralized platform.
            </p>
            <div className="mt-5 sm:mt-8 flex gap-4">
              <Link
                to="/properties"
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Browse Properties
              </Link>
              <Link
                to="/register"
                className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
          </div>
          {/* Right: Image */}
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <img
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
              alt="Modern home"
            />
          </div>
        </div>
      </div>

      {/* Featured Properties Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Properties
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Discover our handpicked selection of premium properties
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center mt-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
              {featuredProperties.map((property) => (
                <div
                  key={property._id}
                  className="bg-white shadow-lg rounded-lg overflow-hidden"
                >
                  <div className="relative pb-2/3">
                    <img
                      className="absolute h-full w-full object-cover"
                      src={
                        property.images[0] ||
                        "https://via.placeholder.com/400x300"
                      }
                      alt={property.title}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {property.title}
                    </h3>
                    <p className="mt-2 text-gray-500">{property.location}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {property.price} ETH
                      </span>
                      <Link
                        to={`/properties/${property._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/properties"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Properties
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Why Choose PropertyChain?
            </h2>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Secure Transactions
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      All property transactions are secured by blockchain
                      technology, ensuring transparency and trust.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Fast Processing
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      Quick and efficient property transactions with smart
                      contracts, eliminating unnecessary delays.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg
                          className="h-6 w-6 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Verified Properties
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      All listed properties are verified and authenticated
                      through our blockchain network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
