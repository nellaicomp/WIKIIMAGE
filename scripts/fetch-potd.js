import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { format } from 'date-fns';

const IMAGES_DIR = 'public/images/potd';
const DATA_DIR = 'src/data/potd';

async function fetchWikipediaPOTD() {
  const date = format(new Date(), 'yyyy-MM-dd');
  const apiUrl = `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${date}`;
  
  try {
    // Create directories if they don't exist
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Fetch POTD data from Wikipedia
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    // Get the image from the correct path in the API response
    const image = data.image?.source || data.thumbnail?.source;
    if (!image) {
      throw new Error('No image found in the API response');
    }
    
    const description = data.extract || data.description || 'No description available';
    const title = data.title || 'Wikipedia Picture of the Day';
    
    // Download and process image
    const imageResponse = await fetch(image);
    const imageBuffer = await imageResponse.buffer();
    
    // Save optimized image
    const imagePath = path.join(IMAGES_DIR, `${date}.jpg`);
    await sharp(imageBuffer)
      .resize(1200, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(imagePath);
    
    // Save metadata
    const metadata = {
      title,
      description,
      image: `/images/potd/${date}.jpg`,
      pubDate: date,
      originalUrl: image,
      imageDescription: description
    };
    
    await fs.writeFile(
      path.join(DATA_DIR, `${date}.json`),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log(`Successfully fetched and saved POTD for ${date}`);
  } catch (error) {
    console.error('Error fetching POTD:', error);
    throw error;
  }
}

fetchWikipediaPOTD();