export interface WikipediaInfo {
  extract: string;
  thumbnail?: string;
  sourceUrl: string;
}

export async function fetchFlowerInfo(speciesName: string): Promise<WikipediaInfo | null> {
  try {
    const title = encodeURIComponent(speciesName);
    const apiUrl = `https://no.wikipedia.org/api/rest_v1/page/summary/${title}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'FlowerHunt/1.0 (https://ais-dev.europe-west2.run.app)'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    return {
      extract: data.extract || '',
      thumbnail: data.thumbnail?.source,
      sourceUrl: data.content_urls?.desktop?.page || `https://no.wikipedia.org/wiki/${title}`
    };
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return null;
  }
}
