// pacman.js - Generate a Pac-Man contribution animation
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const d3 = require('d3');
const { formatISO, subDays, parseISO, eachDayOfInterval } = require('date-fns');
const { Octokit } = require('@actions/github');

// GitHub token from environment variable
const token = process.env.GITHUB_TOKEN;
const octokit = new Octokit({ auth: token });

// Your GitHub username - replace with your actual username
const username = 'manishgyawali';

async function generatePacmanAnimation() {
  try {
    // Fetch contribution data for the last year
    const today = new Date();
    const oneYearAgo = subDays(today, 365);
    
    // Get contribution data from GitHub
    const { data: userData } = await octokit.rest.users.getByUsername({
      username: username,
    });
    
    // Create a date range for the last year
    const dateRange = eachDayOfInterval({
      start: oneYearAgo,
      end: today,
    });
    
    // Create a canvas for drawing
    const canvasWidth = 900;
    const canvasHeight = 150;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Set background
    ctx.fillStyle = '#0d1117'; // GitHub dark mode background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Generate contribution grid
    const cellSize = 12;
    const cellGap = 3;
    const startX = 30;
    const startY = 30;
    
    // Map dates to grid positions
    const datePositions = [];
    let currentX = startX;
    let currentY = startY;
    let weekCount = 0;
    
    // Generate a simulated contribution grid
    dateRange.forEach((date, i) => {
      const dayOfWeek = date.getDay();
      
      if (dayOfWeek === 0 && i > 0) {
        weekCount++;
        currentX = startX + (weekCount * (cellSize + cellGap));
        currentY = startY;
      } else if (i > 0) {
        currentY = startY + (dayOfWeek * (cellSize + cellGap));
      }
      
      datePositions.push({
        date: formatISO(date, { representation: 'date' }),
        x: currentX,
        y: currentY,
        count: Math.floor(Math.random() * 5) // Simulated contribution count (0-4)
      });
    });
    
    // Draw the grid
    datePositions.forEach(pos => {
      // Color based on contribution count
      if (pos.count === 0) {
        ctx.fillStyle = '#161b22'; // Empty cell
      } else if (pos.count === 1) {
        ctx.fillStyle = '#0e4429'; // Light contribution
      } else if (pos.count === 2) {
        ctx.fillStyle = '#006d32'; // Medium contribution
      } else if (pos.count === 3) {
        ctx.fillStyle = '#26a641'; // High contribution
      } else {
        ctx.fillStyle = '#39d353'; // Very high contribution
      }
      
      ctx.fillRect(pos.x, pos.y, cellSize, cellSize);
    });
    
    // Draw Pac-Man animation frames
    const pacmanFrames = generatePacmanFrames();
    const animationData = generateAnimationData(datePositions, pacmanFrames);
    
    // Create SVG with animation
    const svgContent = createAnimatedSVG(canvas, animationData);
    
    // Write SVG to file
    fs.writeFileSync('pacman-contribution-animation.svg', svgContent);
    console.log('✅ Generated Pac-Man contribution animation!');
    
  } catch (error) {
    console.error('Error generating animation:', error);
    process.exit(1);
  }
}

function generatePacmanFrames() {
  // Generate Pac-Man animation frames
  return [
    { // Open mouth
      path: (x, y, size) => `
        M${x},${y} 
        A${size/2},${size/2} 0 1,1 ${x},${y + size} 
        L${x + size/2},${y + size/2} Z
      `,
      fill: '#FFCC00'
    },
    { // Half open
      path: (x, y, size) => `
        M${x},${y} 
        A${size/2},${size/2} 0 1,1 ${x},${y + size} 
        L${x + size/2},${y + size/2} Z
      `,
      fill: '#FFCC00'
    },
    { // Closed mouth
      path: (x, y, size) => `
        M${x},${y} 
        A${size/2},${size/2} 0 1,0 ${x},${y + size} 
        A${size/2},${size/2} 0 1,0 ${x},${y} Z
      `,
      fill: '#FFCC00'
    },
    { // Half open (reverse)
      path: (x, y, size) => `
        M${x},${y} 
        A${size/2},${size/2} 0 1,1 ${x},${y + size} 
        L${x + size/2},${y + size/2} Z
      `,
      fill: '#FFCC00'
    }
  ];
}

function generateAnimationData(positions, frames) {
  // Create animation keyframes along the contribution grid
  const cellSize = 12;
  const animationData = [];
  
  // Sort positions by week then by day
  const sortedPositions = [...positions].sort((a, b) => {
    const aX = a.x;
    const bX = b.x;
    if (aX === bX) {
      return a.y - b.y;
    }
    return aX - bX;
  });
  
  // Add animation keyframes
  sortedPositions.forEach((pos, i) => {
    const frameIndex = i % frames.length;
    const pacmanSize = cellSize * 1.2; // Slightly larger than cells
    
    animationData.push({
      x: pos.x - pacmanSize/4,
      y: pos.y - pacmanSize/4,
      size: pacmanSize,
      frame: frames[frameIndex],
      delay: i * 0.03 // Staggered animation timing
    });
    
    // Add pellet being eaten
    if (pos.count > 0) {
      animationData.push({
        pellet: true,
        x: pos.x + cellSize/2,
        y: pos.y + cellSize/2,
        size: pos.count * 2,
        delay: i * 0.03 - 0.02,
        duration: 0.1
      });
    }
  });
  
  return animationData;
}

function createAnimatedSVG(canvas, animationData) {
  // Create SVG with animation elements
  const width = canvas.width;
  const height = canvas.height;
  
  // Start SVG document
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .pacman { animation: chomp 0.4s linear infinite; }
    @keyframes chomp {
      0% { transform: scaleX(1); }
      50% { transform: scaleX(0.8); }
      100% { transform: scaleX(1); }
    }
    .pellet { animation: fadeOut 0.3s linear forwards; }
    @keyframes fadeOut {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
  </style>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="#0d1117" />
  
  <!-- Contribution grid from canvas -->
  <image href="${canvas.toDataURL()}" width="${width}" height="${height}" />
  
  <!-- Animation elements -->
  <g id="animation-group">
`;
  
  // Add Pac-Man and pellets with staggered animation
  animationData.forEach((item, i) => {
    if (item.pellet) {
      // Pellet animation
      svg += `    <circle class="pellet" cx="${item.x}" cy="${item.y}" r="${item.size}" fill="#FFCC00" 
                  style="animation-delay: ${item.delay}s; animation-duration: ${item.duration}s; opacity: 0;" />
`;
    } else {
      // Pac-Man animation
      svg += `    <path class="pacman" d="${item.frame.path(item.x, item.y, item.size)}" fill="${item.frame.fill}" 
                 style="animation-delay: ${item.delay}s;" />
`;
    }
  });
  
  // Add title and footer
  svg += `  </g>
  
  <!-- Title -->
  <text x="30" y="20" font-family="Arial, sans-serif" font-size="14" fill="#58A6FF">Pac-Man Contribution Animation</text>
  
  <!-- Footer -->
  <text x="${width - 160}" y="${height - 10}" font-family="Arial, sans-serif" font-size="12" fill="#8B949E">Generated for @${username}</text>
</svg>`;
  
  return svg;
}

// Run the animation generator
generatePacmanAnimation();
