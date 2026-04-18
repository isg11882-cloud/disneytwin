/**
 * Disney API Integration Module
 * Fetches character data from https://disneyapi.dev/
 */

export interface DisneyCharacter {
  _id: number;
  name: string;
  imageUrl?: string;
  url: string;
  films: string[];
  shortFilms: string[];
  tvShows: string[];
  videoGames: string[];
  parkAttractions: string[];
  allies: string[];
  enemies: string[];
}

/**
 * Searches for a Disney character by name
 */
export async function getCharacterByName(name: string): Promise<DisneyCharacter | null> {
  try {
    const encodedName = encodeURIComponent(name);
    const response = await fetch(`https://api.disneyapi.dev/character?name=${encodedName}`);
    
    if (!response.ok) throw new Error('API request failed');
    
    const result = await response.json();
    
    // The API returns an array (paginated data) or single item
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      // Find exact match or return first one
      const exactMatch = result.data.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      return exactMatch || result.data[0];
    } 
    
    if (result.data && !Array.isArray(result.data)) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Disney character:', error);
    return null;
  }
}
