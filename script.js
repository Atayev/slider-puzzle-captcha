const puzzleCanvas = document.getElementById('puzzleCanvas');
const pieceCanvas = document.getElementById('pieceCanvas');
const puzzleCtx = puzzleCanvas.getContext('2d');
const pieceCtx = pieceCanvas.getContext('2d');

const pieceSize = 50; // Size of the sliding piece
let missingPiece = { x: 0, y: 0 }; // Blank part of the main canvas
let piecePosition = { x: 0, y: 0 }; // Starting position of the sliding piece
let dragging = false;
let firstAttemptFailed = false;
let puzzleSolved = false; 

let image = new Image();
let arrowImage = new Image();
arrowImage.src = 'arrow-right.png'; // Path to the arrow image

// Fetch a random image
fetch('https://randomfox.ca/floof/')
  .then((res) => res.json())
  .then((data) => {
    image.src = data.image;
  })
  .catch((err) => console.error('Failed to fetch image', err));

image.onload = () => {
  initializePositions();
  drawPuzzle();
  drawPiece();
};

function getRandomPosition(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function initializePositions() {
  // Ensure the missing piece is in the second 50% of the image
  missingPiece.x = getRandomPosition(puzzleCanvas.width / 2, puzzleCanvas.width - pieceSize);
  missingPiece.y = getRandomPosition(0, puzzleCanvas.height - pieceSize);

  // Ensure the piece is in the first 50% of the image and in the same row as the missing piece
  piecePosition.y = missingPiece.y;
  piecePosition.x = getRandomPosition(0, puzzleCanvas.width / 2 - pieceSize);

  pieceCanvas.style.position = 'absolute';
  pieceCanvas.style.left = `${piecePosition.x}px`;
  pieceCanvas.style.top = `${piecePosition.y}px`;
}

function drawPuzzlePiece(ctx, x, y, size, inward = true) {
  const path = new Path2D();
  const tabSize = size / 4;
  const curveSize = size / 6;

  path.moveTo(x, y); // Start at the top-left corner

  // Top edge
  path.lineTo(x + size / 3, y);
  if (inward) {
    path.quadraticCurveTo(x + size / 2, y - curveSize, x + (2 * size) / 3, y);
  } else {
    path.quadraticCurveTo(x + size / 2, y + curveSize, x + (2 * size) / 3, y);
  }
  path.lineTo(x + size, y);

  // Right edge
  path.lineTo(x + size, y + size / 3);
  if (inward) {
    path.quadraticCurveTo(x + size + curveSize, y + size / 2, x + size, y + (2 * size) / 3);
  } else {
    path.quadraticCurveTo(x - curveSize, y + size / 2, x + size, y + (2 * size) / 3);
  }
  path.lineTo(x + size, y + size);

  // Bottom edge
  path.lineTo(x + (2 * size) / 3, y + size);
  if (inward) {
    path.quadraticCurveTo(x + size / 2, y + size + curveSize, x + size / 3, y + size);
  } else {
    path.quadraticCurveTo(x + size / 2, y - curveSize, x + size / 3, y + size);
  }
  path.lineTo(x, y + size);

  // Left edge
  path.lineTo(x, y + (2 * size) / 3);
  if (inward) {
    path.quadraticCurveTo(x - curveSize, y + size / 2, x, y + size / 3);
  } else {
    path.quadraticCurveTo(x + curveSize, y + size / 2, x, y + size / 3);
  }
  path.lineTo(x, y);

  ctx.save();
  ctx.clip(path); // Clip to the puzzle shape
  ctx.drawImage(image, x, y, size, size, x, y, size, size); // Draw the image within the puzzle shape
  ctx.restore(); // Restore the drawing context
}

function drawPuzzle() {
  puzzleCtx.clearRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);
  puzzleCtx.drawImage(image, 0, 0, puzzleCanvas.width, puzzleCanvas.height);

  // Draw the missing piece as a puzzle shape
  drawPuzzlePiece(puzzleCtx, missingPiece.x, missingPiece.y, pieceSize, true);
  puzzleCtx.clearRect(missingPiece.x, missingPiece.y, pieceSize, pieceSize);
  puzzleCtx.restore(); // Restore the drawing context
}

function drawPiece() {
  pieceCtx.clearRect(0, 0, pieceCanvas.width, pieceCanvas.height);
  const scaleX = image.width / puzzleCanvas.width;
  const scaleY = image.height / puzzleCanvas.height;

  drawPuzzlePiece(pieceCtx, 0, 0, pieceSize, false);

  pieceCtx.drawImage(
    image,
    missingPiece.x * scaleX,
    missingPiece.y * scaleY,
    pieceSize * scaleX,
    pieceSize * scaleY,
    0,
    0,
    pieceSize,
    pieceSize
  );
  pieceCtx.restore(); // Restore the drawing context
  pieceCanvas.style.left = `${piecePosition.x}px`;
  pieceCanvas.style.top = `${piecePosition.y}px`;
}

function checkSolution() {
  const tolerance = 10; // Allowable error in pixels
  const isXCorrect = Math.abs(piecePosition.x - missingPiece.x) < tolerance;
  const isYCorrect = Math.abs(piecePosition.y - missingPiece.y) < tolerance;

  if (isXCorrect && isYCorrect) {
    puzzleSolved = true; // Mark puzzle as solved
    pieceCanvas.style.border = '2px solid green'; // Change border to green
    setTimeout(() => {
      pieceCanvas.style.border = 'none'; // Remove border after a short delay
      reloadImage();
    }, 500);
  } else {
    pieceCanvas.style.border = '2px solid red'; // Change border to red
    setTimeout(() => {
      pieceCanvas.style.border = 'none'; // Remove border after a short delay
    }, 500);
    if (!firstAttemptFailed) {
      firstAttemptFailed = true;
      reloadImage();
    }
  }
}

function reloadImage() {
  fetch('https://randomfox.ca/floof/')
    .then((res) => res.json())
    .then((data) => {
      image.src = data.image;
      puzzleSolved = false; // Reset puzzle state
      initializePositions();
      drawPuzzle();
      drawPiece();
    })
    .catch((err) => console.error('Failed to fetch image', err));
}

// Handle drag events for the piece
pieceCanvas.addEventListener('mousedown', (e) => {
  const rect = pieceCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x >= 0 && x <= pieceSize && y >= 0 && y <= pieceSize) {
    dragging = true;
  }
});

document.addEventListener('mousemove', (e) => {
  if (dragging && !puzzleSolved) {
    const rect = puzzleCanvas.getBoundingClientRect();
    let newX = e.clientX - rect.left - pieceSize / 2;
    let newY = e.clientY - rect.top - pieceSize / 2;
    newX = Math.max(0, Math.min(newX, puzzleCanvas.width - pieceSize));
    newY = Math.max(0, Math.min(newY, puzzleCanvas.height - pieceSize));
    piecePosition.x = newX;
    piecePosition.y = newY;
    pieceCanvas.style.left = `${piecePosition.x}px`;
    pieceCanvas.style.top = `${piecePosition.y}px`;
  }
});

document.addEventListener('mouseup', (e) => {
  if (dragging) {
    dragging = false;
    checkSolution();
  }
});