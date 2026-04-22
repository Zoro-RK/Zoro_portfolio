const fs = require('fs');
const Jimp = require('jimp');

async function run() {
  const image = await Jimp.read('public/bg.png');
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Add all boundary pixels to queue
  for (let x = 0; x < width; x++) {
    queue.push([x, 0]); queue.push([x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    queue.push([0, y]); queue.push([width - 1, y]);
  }

  let head = 0;
  while(head < queue.length) {
    const [x, y] = queue[head++];
    const index = y * width + x;
    if (visited[index] === 1) continue;
    
    // Check pixel color
    const idx = index * 4;
    const r = image.bitmap.data[idx];
    const g = image.bitmap.data[idx+1];
    const b = image.bitmap.data[idx+2];

    // Background threshold (near white, including light grey)
    if (r > 200 && g > 200 && b > 200) {
      visited[index] = 1;
      image.bitmap.data[idx+3] = 0; // Set fully transparent

      // Push neighbors
      if (x+1 < width) queue.push([x+1, y]);
      if (x-1 >= 0) queue.push([x-1, y]);
      if (y+1 < height) queue.push([x, y+1]);
      if (y-1 >= 0) queue.push([x, y-1]);
    } else {
        visited[index] = 2; // boundary, keep opaque
    }
  }

  await image.writeAsync('public/bg_transparent.png');
  console.log("Image saved!");
}

run().catch(console.error);
