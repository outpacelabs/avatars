/**
 * Animal Names Utility
 *
 * Generates fun startup-themed animal names for anonymous users.
 * Names persist per session using sessionStorage.
 */

const ANIMAL_NAMES = [
  'Founding Ferret',
  'Raising Rabbit',
  'YC-backed Yak',
  'A16z Ape',
  'Series A Shark',
  'Crypto Cat',
  'CEO Cheetah',
  'Tech Tiger',
  'Cracked Crocodile',
  'Kickstart Kangaroo',
  'Stealth Stallion',
  'Bootstrap Buffalo',
  'Pre-seed Panther',
  'Venture Viper',
  'Enterprise Emu',
  'Angel Armadillo',
  'Incubator Iguana',
  'Pivoting Penguin',
  'O-1 Orca',
  'Startup Sparrow',
  'Unreal Unicorn',
  'GPU Giraffe',
  'Vibe-code Vulture',
  'Prompt Parrot',
  'DeFi Dalmatian',
  'IPO Impala',
  'ARR Alpaca',
  'MRR Manatee',
  'C-level Chihuahua',
  'Pitch Pony',
  'Launch Lion',
  'Zen Zebra',
  '10x Tuna',
  'Outpace Octopus',
  'Sprint Salmon',
  'Builder Beaver',
] as const;

const STORAGE_KEY = 'outpace_animal_name';
const SESSION_ID_KEY = 'outpace_session_id';

/**
 * Get a random animal name from the list
 */
function getRandomAnimalName(): string {
  const index = Math.floor(Math.random() * ANIMAL_NAMES.length);
  return ANIMAL_NAMES[index];
}

/**
 * Get the session animal name.
 * If one doesn't exist, generates a new one and stores it in sessionStorage.
 * Returns the same name for the entire browser session.
 */
export function getSessionAnimalName(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return getRandomAnimalName();
  }

  try {
    // Try to get existing name from sessionStorage
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return stored;
    }

    // Generate new name and store it
    const newName = getRandomAnimalName();
    sessionStorage.setItem(STORAGE_KEY, newName);
    return newName;
  } catch {
    // sessionStorage not available (private browsing, etc.)
    return getRandomAnimalName();
  }
}

/**
 * Get all available animal names (for testing/debugging)
 */
export function getAllAnimalNames(): readonly string[] {
  return ANIMAL_NAMES;
}

/**
 * Get or create a unique session ID.
 * Persists in sessionStorage for the browser session.
 * Used to consistently assign gradient avatars to users.
 */
export function getSessionId(): string {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }

  try {
    // Try to get existing session ID
    const stored = sessionStorage.getItem(SESSION_ID_KEY);
    if (stored) {
      return stored;
    }

    // Generate new session ID and store it
    const newId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, newId);
    return newId;
  } catch {
    // sessionStorage not available (private browsing, etc.)
    return crypto.randomUUID();
  }
}
