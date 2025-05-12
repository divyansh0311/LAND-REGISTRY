// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyContract {
    struct Property {
        string title;
        string description;
        string location;
        uint256 size;
        uint256 bedrooms;
        uint256 bathrooms;
        uint256 price;
        address seller;
        address buyer;
        bool isSold;
    }

    mapping(uint256 => Property) public properties;
    uint256 public propertyCount;

    event PropertyListed(uint256 indexed propertyId, address indexed seller);
    event PropertySold(uint256 indexed propertyId, address indexed buyer);

    constructor() {
        propertyCount = 0;
    }

    function listProperty(
        string memory _title,
        string memory _description,
        string memory _location,
        uint256 _size,
        uint256 _bedrooms,
        uint256 _bathrooms,
        uint256 _price
    ) public {
        propertyCount++;
        properties[propertyCount] = Property({
            title: _title,
            description: _description,
            location: _location,
            size: _size,
            bedrooms: _bedrooms,
            bathrooms: _bathrooms,
            price: _price,
            seller: msg.sender,
            buyer: address(0),
            isSold: false
        });

        emit PropertyListed(propertyCount, msg.sender);
    }

    function buyProperty(uint256 _propertyId) public payable {
        Property storage property = properties[_propertyId];
        require(!property.isSold, "Property is already sold");
        require(msg.value >= property.price, "Insufficient payment");
        require(msg.sender != property.seller, "Seller cannot buy their own property");

        // Transfer payment to seller
        payable(property.seller).transfer(msg.value);

        // Update property status
        property.buyer = msg.sender;
        property.isSold = true;

        emit PropertySold(_propertyId, msg.sender);
    }

    function getProperty(uint256 _propertyId) public view returns (
        string memory title,
        string memory description,
        string memory location,
        uint256 size,
        uint256 bedrooms,
        uint256 bathrooms,
        uint256 price,
        address seller,
        address buyer,
        bool isSold
    ) {
        Property memory property = properties[_propertyId];
        return (
            property.title,
            property.description,
            property.location,
            property.size,
            property.bedrooms,
            property.bathrooms,
            property.price,
            property.seller,
            property.buyer,
            property.isSold
        );
    }

    function isPropertyListed(uint256 _propertyId) public view returns (bool) {
        return _propertyId > 0 && _propertyId <= propertyCount && properties[_propertyId].seller != address(0);
    }
} 