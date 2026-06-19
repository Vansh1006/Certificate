// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract NCFLCertificateVerifier is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct CertificateRecord {
        address issuer;
        uint64 issuedAt;
        uint64 revokedAt;
        string metadataURI;
        bool exists;
    }

    mapping(bytes32 => CertificateRecord) private certificates;

    event CertificateIssued(
        bytes32 indexed certificateHash,
        address indexed issuer,
        string metadataURI,
        uint256 issuedAt
    );

    event CertificateRevoked(
        bytes32 indexed certificateHash,
        address indexed revokedBy,
        string reason,
        uint256 revokedAt
    );

    event CertificateMetadataUpdated(
        bytes32 indexed certificateHash,
        address indexed updatedBy,
        string metadataURI
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) public initializer {
        require(admin != address(0), "Invalid admin");

        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    function issueCertificate(bytes32 certificateHash, string calldata metadataURI)
        external
        onlyRole(ISSUER_ROLE)
    {
        _issueCertificate(certificateHash, metadataURI);
    }

    function issueBatch(bytes32[] calldata certificateHashes, string[] calldata metadataURIs)
        external
        onlyRole(ISSUER_ROLE)
    {
        require(certificateHashes.length == metadataURIs.length, "Length mismatch");
        require(certificateHashes.length <= 200, "Batch too large");

        for (uint256 i = 0; i < certificateHashes.length; i++) {
            _issueCertificate(certificateHashes[i], metadataURIs[i]);
        }
    }

    function revokeCertificate(bytes32 certificateHash, string calldata reason)
        external
        onlyRole(ISSUER_ROLE)
    {
        CertificateRecord storage record = certificates[certificateHash];
        require(record.exists, "Certificate not found");
        require(record.revokedAt == 0, "Already revoked");
        require(
            record.issuer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only issuer or admin"
        );

        record.revokedAt = uint64(block.timestamp);
        emit CertificateRevoked(certificateHash, msg.sender, reason, block.timestamp);
    }

    function updateMetadataURI(bytes32 certificateHash, string calldata metadataURI)
        external
        onlyRole(ISSUER_ROLE)
    {
        CertificateRecord storage record = certificates[certificateHash];
        require(record.exists, "Certificate not found");
        require(record.revokedAt == 0, "Certificate revoked");
        require(
            record.issuer == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Only issuer or admin"
        );

        record.metadataURI = metadataURI;
        emit CertificateMetadataUpdated(certificateHash, msg.sender, metadataURI);
    }

    function verifyCertificate(bytes32 certificateHash)
        external
        view
        returns (
            bool valid,
            bool revoked,
            address issuer,
            uint256 issuedAt,
            uint256 revokedAt,
            string memory metadataURI
        )
    {
        CertificateRecord memory record = certificates[certificateHash];
        valid = record.exists && record.revokedAt == 0;
        revoked = record.exists && record.revokedAt != 0;
        issuer = record.issuer;
        issuedAt = record.issuedAt;
        revokedAt = record.revokedAt;
        metadataURI = record.metadataURI;
    }

    function certificateExists(bytes32 certificateHash) external view returns (bool) {
        return certificates[certificateHash].exists;
    }

    function _issueCertificate(bytes32 certificateHash, string calldata metadataURI) private {
        require(certificateHash != bytes32(0), "Invalid hash");
        require(bytes(metadataURI).length > 0, "Metadata URI required");
        require(!certificates[certificateHash].exists, "Already issued");

        certificates[certificateHash] = CertificateRecord({
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0,
            metadataURI: metadataURI,
            exists: true
        });

        emit CertificateIssued(certificateHash, msg.sender, metadataURI, block.timestamp);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}
}
