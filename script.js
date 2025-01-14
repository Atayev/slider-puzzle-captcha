const puzzleCanvas = document.getElementById('puzzleCanvas');
const pieceCanvas = document.getElementById('pieceCanvas');
const sliderCanvas = document.getElementById('sliderCanvas');
const puzzleCtx = puzzleCanvas.getContext('2d');
const pieceCtx = pieceCanvas.getContext('2d');
const sliderCtx = sliderCanvas.getContext('2d');

const pieceSize = 50; // Size of the sliding piece
let missingPiece = { x: 0, y: 0 }; // Blank part of the main canvas
let piecePosition = { x: 0, y: 0 }; // Starting position of the sliding piece
let dragging = false;
let sliderDragging = false;
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

arrowImage.onload = () => {
  drawSlider();
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

function drawPuzzle() {
  puzzleCtx.clearRect(0, 0, puzzleCanvas.width, puzzleCanvas.height);
  puzzleCtx.drawImage(image, 0, 0, puzzleCanvas.width, puzzleCanvas.height);
  puzzleCtx.clearRect(missingPiece.x, missingPiece.y, pieceSize, pieceSize);
}

function drawPiece() {
  pieceCtx.clearRect(0, 0, pieceCanvas.width, pieceCanvas.height);
  const scaleX = image.width / puzzleCanvas.width;
  const scaleY = image.height / puzzleCanvas.height;
  pieceCtx.drawImage(
    image,
    missingPiece.x * scaleX,
    missingPiece.y * scaleY,
    pieceSize * scaleX,
    pieceSize * scaleY,
    0, 0,
    pieceSize, pieceSize
  );
  pieceCanvas.style.left = `${piecePosition.x}px`;
  pieceCanvas.style.top = `${piecePosition.y}px`;
}

function drawSlider(position = 0) {
  sliderCtx.clearRect(0, 0, sliderCanvas.width, sliderCanvas.height);
  sliderCtx.drawImage(arrowImage, position, 0, 50, 50);
}

function checkSolution() {
  const tolerance = 10; // Allowable error in pixels
  const isXCorrect = Math.abs(piecePosition.x - missingPiece.x) < tolerance;
  const isYCorrect = Math.abs(piecePosition.y - missingPiece.y) < tolerance;

  if (isXCorrect && isYCorrect) {
    puzzleSolved = true; // Mark puzzle as solved
    pieceCanvas.style.border = '2px solid green'; // Change border to green
    const solvedPosition = (piecePosition.x / (puzzleCanvas.width - pieceSize)) * (sliderCanvas.width - 50);
    arrowImage.src = 'check.png'; // Change arrow image to checkmark
    drawSlider(solvedPosition); // Redraw slider with the check image in place
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

function resetSlider() {
  if (!puzzleSolved) { // Only reset the slider if the puzzle is not solved
    sliderCtx.clearRect(0, 0, sliderCanvas.width, sliderCanvas.height);
    arrowImage.src = 'arrow-right.png'; // Reset arrow image
    drawSlider(0); // Reset slider position
    piecePosition.x = 0; // Reset piece position
    pieceCanvas.style.left = `${piecePosition.x}px`;
    drawPiece();
  }
}

function reloadImage() {
  fetch('https://randomfox.ca/floof/')
    .then((res) => res.json())
    .then((data) => {
      image.src = data.image;
      puzzleSolved = false; // Reset puzzle state
      resetSlider();
    })
    .catch((err) => console.error('Failed to fetch image', err));
}

// Handle drag events for the slider
sliderCanvas.addEventListener('mousedown', (e) => {
  const rect = sliderCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x >= 0 && x <= 50 && y >= 0 && y <= 50) {
    sliderDragging = true;
  }
});

document.addEventListener('mousemove', (e) => {
  if (sliderDragging && !puzzleSolved) {
    const rect = sliderCanvas.getBoundingClientRect();
    let newX = e.clientX - rect.left - 25; // Center the arrow
    newX = Math.max(0, Math.min(newX, sliderCanvas.width - 50)); // Ensure the arrow stays within the slider
    sliderCtx.clearRect(0, 0, sliderCanvas.width, sliderCanvas.height);
    sliderCtx.drawImage(arrowImage, newX, 0, 50, 50);

    // Update the piece position based on the slider
    piecePosition.x = (newX / (sliderCanvas.width - 50)) * (puzzleCanvas.width - pieceSize);
    piecePosition.y = missingPiece.y; // Ensure the piece stays in the same row as the missing piece
    pieceCanvas.style.left = `${piecePosition.x}px`;
    pieceCanvas.style.top = `${piecePosition.y}px`;
    drawPiece();
  }
});

document.addEventListener('mouseup', (e) => {
  if (sliderDragging) {
    sliderDragging = false;
    if (!puzzleSolved) {
      checkSolution();
    }
  }
});