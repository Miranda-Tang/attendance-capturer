import { getTokens } from "./auth";

class TouchIDAuthService {
	constructor() {
		this.rpId = window.location.hostname;
		this.rpName = "Attendance App";
		this.timeout = 60000;

		// Add tab/window tracking
		this.initializeTabTracking();
	}

	initializeTabTracking() {
		// Generate unique session ID for this tab
		if (!sessionStorage.getItem("tabId")) {
			sessionStorage.setItem("tabId", Date.now().toString());
		}

		// Store the active tab ID
		localStorage.setItem("activeTabId", sessionStorage.getItem("tabId"));

		// Clear protected area state when tab/window closes
		window.addEventListener("unload", () => {
			if (
				localStorage.getItem("activeTabId") === sessionStorage.getItem("tabId")
			) {
				this.clearProtectedAreaState();
			}
		});
	}

	setInProtectedArea(value) {
		localStorage.setItem("inProtectedArea", value);
		// Store which tab set the protected area
		localStorage.setItem("protectedAreaTabId", sessionStorage.getItem("tabId"));
	}

	isInProtectedArea() {
		return (
			localStorage.getItem("inProtectedArea") === "true" &&
			localStorage.getItem("protectedAreaTabId") ===
				sessionStorage.getItem("tabId")
		);
	}

	clearProtectedAreaState() {
		if (
			localStorage.getItem("protectedAreaTabId") ===
			sessionStorage.getItem("tabId")
		) {
			localStorage.removeItem("inProtectedArea");
			localStorage.removeItem("protectedAreaTabId");
		}
	}

	// Check if the device supports TouchID/biometric auth
	async checkSupport() {
		if (typeof window === "undefined" || !window.PublicKeyCredential) {
			throw new Error("WebAuthn is not supported in this browser");
		}

		const available =
			await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

		if (!available) {
			throw new Error(
				"Biometric authentication is not available on this device"
			);
		}

		return true;
	}

	// Generate credential options for registration
	async generateRegistrationOptions(userEmail) {
		const { idToken } = getTokens();
		if (!idToken) {
			throw new Error("User not authenticated");
		}

		// Parse user ID from token
		const payload = JSON.parse(atob(idToken.split(".")[1]));
		const userId = payload.sub;

		// Convert user ID to Uint8Array
		const encoder = new TextEncoder();
		const userIdBuffer = encoder.encode(userId);

		return {
			challenge: window.crypto.getRandomValues(new Uint8Array(32)),
			rp: {
				name: this.rpName,
				id: this.rpId,
			},
			user: {
				id: userIdBuffer,
				name: userEmail,
				displayName: "Admin User",
			},
			pubKeyCredParams: [
				{
					type: "public-key",
					alg: -7, // ES256
				},
				{
					type: "public-key",
					alg: -257, // RS256
				},
			],
			authenticatorSelection: {
				authenticatorAttachment: "platform",
				userVerification: "required",
				residentKey: "required",
			},
			timeout: this.timeout,
		};
	}

	// Register TouchID
	async register(userEmail) {
		try {
			await this.checkSupport();

			const options = await this.generateRegistrationOptions(userEmail);
			const credential = await navigator.credentials.create({
				publicKey: options,
			});

			// Store credential info
			const credentialId = btoa(
				String.fromCharCode(...new Uint8Array(credential.rawId))
			);

			localStorage.setItem("touchIDCredentialId", credentialId);
			localStorage.setItem("touchIDRegistered", "true");
			localStorage.setItem("touchIDRegistrationTime", Date.now().toString());

			return true;
		} catch (error) {
			console.error("Registration failed:", error);
			this.clearRegistration();
			throw error;
		}
	}

	// Generate verification options
	async generateVerificationOptions() {
		const credentialId = localStorage.getItem("touchIDCredentialId");
		if (!credentialId) {
			throw new Error("No credential found");
		}

		const challenge = window.crypto.getRandomValues(new Uint8Array(32));

		return {
			challenge,
			rpId: this.rpId,
			timeout: this.timeout,
			userVerification: "required",
			allowCredentials: [
				{
					type: "public-key",
					id: Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0)),
					transports: ["internal"],
				},
			],
		};
	}

	// Add this method to check if credential exists
	async checkCredentialExists() {
		const credentialId = localStorage.getItem("touchIDCredentialId");
		if (!credentialId) {
			return false;
		}
		return true; // Simplified check to avoid browser prompts
	}

	// Verify TouchID
	async verify() {
		try {
			await this.checkSupport();

			const registrationTime = localStorage.getItem("touchIDRegistrationTime");
			const timeElapsed = Date.now() - parseInt(registrationTime || "0");

			if (timeElapsed > 30 * 24 * 60 * 60 * 1000) {
				this.clearRegistration();
				throw new Error("TouchID registration expired");
			}

			const options = await this.generateVerificationOptions();
			const assertion = await navigator.credentials.get({
				publicKey: options,
			});

			localStorage.setItem("touchIDVerified", "true");
			localStorage.setItem("touchIDVerificationTime", Date.now().toString());
			this.setInProtectedArea("true");

			return true;
		} catch (error) {
			console.error("Verification failed:", error);
			this.clearRegistration();
			this.clearProtectedAreaState(); // Clear protected area state on error
			throw error;
		}
	}

	// Check if verification is still valid
	isVerificationValid() {
		const verificationTime = localStorage.getItem("touchIDVerificationTime");
		if (!verificationTime) return false;

		// Verification expires after 30 minutes
		const timeElapsed = Date.now() - parseInt(verificationTime);
		return timeElapsed < 30 * 60 * 1000;
	}

	// Clear all TouchID data
	clearRegistration() {
		localStorage.removeItem("touchIDCredentialId");
		localStorage.removeItem("touchIDRegistered");
		localStorage.removeItem("touchIDRegistrationTime");
		localStorage.removeItem("touchIDVerified");
		localStorage.removeItem("touchIDVerificationTime");
	}

	// Check registration status
	isRegistered() {
		return !!localStorage.getItem("touchIDRegistered");
	}
}

export const touchIDAuth = new TouchIDAuthService();
