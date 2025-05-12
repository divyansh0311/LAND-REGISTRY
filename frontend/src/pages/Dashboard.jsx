import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [purchasedProperties, setPurchasedProperties] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);
  const [allProperties, setAllProperties] = useState([]);
  const [showAllProperties, setShowAllProperties] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching dashboard data for user:", user._id);

        // First, directly check all properties to see what's available
        const allPropertiesResponse = await axios.get(
          `http://localhost:5001/api/properties`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        console.log("All properties in system:", allPropertiesResponse.data.length);
        
        // Now fetch user-specific properties
        const [propertiesRes, transactionsRes] = await Promise.all([
          axios.get(`http://localhost:5001/api/properties`, {
            params: {
              user: user._id,
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          axios.get(`http://localhost:5001/api/transactions`, {
            params: {
              user: user._id,
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

        console.log("User's properties:", propertiesRes.data);

        // Enhanced debugging
        const debugData = {
          totalProperties: allPropertiesResponse.data.length,
          userProperties: propertiesRes.data.length,
          userTransactions: transactionsRes.data.length,
          soldProperties: allPropertiesResponse.data.filter(p => p.status === "sold").length,
          propertiesWithBuyers: allPropertiesResponse.data.filter(p => p.buyer).length,
          propertiesWithThisUserAsBuyer: allPropertiesResponse.data.filter(p => {
            const buyerId = p.buyer?._id || p.buyer;
            return buyerId && buyerId.toString() === user._id.toString();
          }).length
        };
        
        setDebugInfo(debugData);
        console.log("Debug information:", debugData);

        // Filter purchased properties with additional logging
        const purchased = propertiesRes.data.filter((property) => {
          // Check if this property has a buyer and if it's the current user
          const buyerId = property.buyer?._id || property.buyer;
          const userId = user._id;
          
          // Log each property for debugging
          console.log(`Property ${property._id} (${property.title}):`, {
            buyer: buyerId,
            user: userId,
            status: property.status,
            isCurrentUserBuyer: buyerId && userId && buyerId.toString() === userId.toString(),
          });
          
          // A property is purchased by current user if:
          // 1. It has a buyer field
          // 2. The buyer ID matches the current user's ID
          // 3. The status is "sold"
          return (
            buyerId && 
            userId && 
            buyerId.toString() === userId.toString() &&
            property.status === "sold"
          );
        });

        console.log("Purchased properties:", purchased.length);

        setProperties(propertiesRes.data);
        setPurchasedProperties(purchased);
        setTransactions(transactionsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        if (err.response) {
          console.error("Backend error details:", err.response.data);
        }
        setError(
          err.response?.data?.message || "Error fetching dashboard data"
        );
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  // Add a refresh function that can be called when needed
  const refreshData = async () => {
    setLoading(true);
    try {
      const [propertiesRes, transactionsRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/properties`, {
          params: {
            user: user._id,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        axios.get(`http://localhost:5001/api/transactions`, {
          params: {
            user: user._id,
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      // Filter purchased properties
      const purchased = propertiesRes.data.filter((property) => {
        // Check if this property has a buyer and if it's the current user
        const buyerId = property.buyer?._id || property.buyer;
        const userId = user._id;
        
        // A property is purchased by current user if:
        // 1. It has a buyer field
        // 2. The buyer ID matches the current user's ID
        // 3. The status is "sold"
        return (
          buyerId && 
          userId && 
          buyerId.toString() === userId.toString() &&
          property.status === "sold"
        );
      });

      setProperties(propertiesRes.data);
      setPurchasedProperties(purchased);
      setTransactions(transactionsRes.data);
    } catch (err) {
      console.error("Error refreshing data:", err);
      setError(
        err.response?.data?.message || "Error refreshing dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Manual fetch properties function that doesn't rely on the user filter
  const forceFetchPurchasedProperties = async () => {
    setLoading(true);
    try {
      // Get ALL properties in the system
      const allPropertiesRes = await axios.get(
        `http://localhost:5001/api/properties`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      console.log("Force fetch - All properties:", allPropertiesRes.data.length);
      
      // Manually filter for properties where this user is the buyer
      const purchased = allPropertiesRes.data.filter((property) => {
        const buyerId = property.buyer?._id || property.buyer;
        return (
          buyerId && 
          user._id && 
          buyerId.toString() === user._id.toString() &&
          property.status === "sold"
        );
      });
      
      console.log("Force fetch - Found purchased properties:", purchased.length);
      
      setPurchasedProperties(purchased);
      setLoading(false);
    } catch (err) {
      console.error("Error in force fetch:", err);
      setLoading(false);
    }
  };

  // Add a function to claim a property
  const claimProperty = async (propertyId) => {
    try {
      console.log(`Claiming property ${propertyId} for user ${user._id}`);
      setLoading(true);
      
      const response = await axios.put(
        `http://localhost:5001/api/properties/${propertyId}/transaction`,
        {
          buyer: user._id,
          status: "sold"
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      console.log("Property claim response:", response.data);
      
      // Refresh the data
      await refreshData();
      
      alert("Property claimed successfully. It should now appear in your purchased properties.");
    } catch (err) {
      console.error("Error claiming property:", err);
      alert(`Error claiming property: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add a function to fetch all properties
  const fetchAllProperties = async () => {
    try {
      setLoading(true);
      const allPropertiesRes = await axios.get(
        `http://localhost:5001/api/properties`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      setAllProperties(allPropertiesRes.data);
      setShowAllProperties(true);
    } catch (err) {
      console.error("Error fetching all properties:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <h2 className="text-3xl font-extrabold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-lg text-gray-600">
          Welcome back, {user?.name}!
        </p>
      </div>

      {user?.role === "seller" && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Your Listed Properties
            </h3>
            <Link
              to="/properties/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              List New Property
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties
              .filter(property => property.status === "available")
              .map((property) => (
              <div
                key={property._id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                {/* Image Gallery */}
                {property.images && property.images.length > 0 ? (
                  <div className="w-full overflow-x-auto flex gap-2 p-2">
                    {property.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${property.title} - Image ${idx + 1}`}
                        className="h-32 w-auto rounded object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIxNTAlIiB5PSIxNTAlIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <img
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIxNTAlIiB5PSIxNTAlIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                    alt={property.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {property.title}
                  </h4>
                  <p className="text-gray-600">{property.location}</p>
                  <p className="text-gray-900 font-medium mt-2">
                    {property.price} ETH
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span
                      className="px-2 py-1 rounded text-sm bg-green-100 text-green-800"
                    >
                      Available
                    </span>
                    <Link
                      to={`/properties/${property._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {properties.filter(property => property.status === "available").length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                You don't have any available properties listed for sale.
              </p>
              <Link 
                to="/properties/new"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                List Your First Property
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Purchased Properties Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Your Purchased Properties
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={refreshData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Refresh
            </button>
            <button
              onClick={forceFetchPurchasedProperties}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Force Refresh
            </button>
          </div>
        </div>
        
        {purchasedProperties.length === 0 ? (
          <div>
            <p className="text-gray-600 mb-4">
              You have not purchased any properties yet.
            </p>
            <p className="text-sm text-gray-500">
              Note: If you recently purchased a property, you may need to refresh the page.
            </p>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => window.location.reload()}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Reload Page
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {purchasedProperties.map((property) => (
              <div
                key={property._id}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                {/* Image Gallery */}
                {property.images && property.images.length > 0 ? (
                  <div className="w-full overflow-x-auto flex gap-2 p-2">
                    {property.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${property.title} - Image ${idx + 1}`}
                        className="h-32 w-auto rounded object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIxNTAlIiB5PSIxNTAlIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=";
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <img
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIxNTAlIiB5PSIxNTAlIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4="
                    alt={property.title}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {property.title}
                  </h4>
                  <p className="text-gray-600">{property.location}</p>
                  <p className="text-gray-900 font-medium mt-2">
                    {property.price} ETH
                  </p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                      Purchased
                    </span>
                    <Link
                      to={`/properties/${property._id}`}
                      className="text-blue-600 hover:text-blue-800"
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

      {/* Add a section to claim properties */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Claim a Property
          </h3>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600 mb-4">
            If you purchased a property but don't see it in your dashboard, you can claim it here.
          </p>
          
          <div className="flex items-center space-x-4">
            <input
              type="text"
              id="propertyId"
              placeholder="Enter Property ID"
              className="flex-1 p-2 border border-gray-300 rounded"
            />
            <button
              onClick={() => {
                const propertyId = document.getElementById('propertyId').value;
                if (propertyId) {
                  claimProperty(propertyId);
                } else {
                  alert("Please enter a valid Property ID");
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Claim Property
            </button>
          </div>
          
          <p className="mt-2 text-sm text-gray-500">
            You can find property IDs by checking transaction records or property details.
          </p>
        </div>
      </div>

      {/* Add section before "Recent Transactions" to view all properties */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-gray-900">
            All System Properties
          </h3>
          <button
            onClick={fetchAllProperties}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            {showAllProperties ? "Hide Properties" : "Show All Properties"}
          </button>
        </div>
        
        {showAllProperties && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allProperties.map((property) => (
                  <tr key={property._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {property.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          property.status === "available"
                            ? "bg-green-100 text-green-800"
                            : property.status === "sold"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {property.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.price} ETH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.seller?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.buyer?.name || "None"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          to={`/properties/${property._id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        {property.status === "sold" && !property.buyer && (
                          <button
                            onClick={() => claimProperty(property._id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Only show Recent Transactions section if user has transactions */}
      {transactions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Recent Transactions
          </h3>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {transaction.property?.images?.[0] ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={transaction.property.images[0]}
                              alt={transaction.property.title}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.property?.title ||
                              "Property not found"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.property?.location ||
                              "Location not specified"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.type === "purchase" ? "Purchase" : "Sale"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.amount} ETH
                      </div>
                      <div className="text-xs text-gray-500">
                        ≈ ${(transaction.amount * 2000).toFixed(2)} USD
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a
                        href={`https://etherscan.io/tx/${transaction.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate block max-w-xs"
                      >
                        {transaction.transactionHash}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
