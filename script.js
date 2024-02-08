const BLANK_BOARD = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0]
]
  
let counter
let mistakeCounter = 0;
const numArray = [1, 2, 3, 4, 5, 6, 7, 8, 9]

function shuffle( array ) {
	let newArray = [...array]
	for ( let i = newArray.length - 1; i > 0; i-- ) {
		const j = Math.floor( Math.random() * ( i + 1 ) );
		[ newArray[ i ], newArray[ j ] ] = [ newArray[ j ], newArray[ i ] ];
	}
	return newArray;
}

// check if row is safe
const rowSafe = (puzzleArray, emptyCell, num) => {
	// -1 is return value of .find() if value not found
	return puzzleArray[ emptyCell.rowIndex ].indexOf(num) == -1 
}
const colSafe = (puzzleArray, emptyCell, num) => {
	return !puzzleArray.some(row => row[ emptyCell.colIndex ] == num )
}
  
const boxSafe = (puzzleArray, emptyCell, num) => {
	boxStartRow = emptyCell.rowIndex - (emptyCell.rowIndex % 3) // Define top left corner of box region for empty cell
	boxStartCol = emptyCell.colIndex - (emptyCell.colIndex % 3)
	let safe = true
  
	for ( boxRow of [0,1,2] ) {  // Each box region has 3 rows
		for ( boxCol of [0,1,2] ) { // Each box region has 3 columns
			if ( puzzleArray[boxStartRow + boxRow][boxStartCol + boxCol] == num ) { // Num is present in box region?
				safe = false // If number is found, it is not safe to place
			}
		}
	}
	return safe
}

const safeToPlace = ( puzzleArray, emptyCell, num ) => {
	return rowSafe(puzzleArray, emptyCell, num) && 
	colSafe(puzzleArray, emptyCell, num) && 
	boxSafe(puzzleArray, emptyCell, num) 
}

// get next empty cell
const nextEmptyCell = puzzleArray => {
	const emptyCell = {rowIndex: "", colIndex: ""}

	puzzleArray.forEach( (row, rowIndex) => {
		if (emptyCell.colIndex !== "" ) return

		let firstZero = row.find( col => col === 0)

		if (firstZero === undefined) return
		emptyCell.rowIndex = rowIndex
		emptyCell.colIndex = row.indexOf(firstZero)
	})

	if (emptyCell.colIndex !== "") return emptyCell

	return false
}

// generate filled board
const fillPuzzle = startingBoard => {
	const emptyCell = nextEmptyCell(startingBoard)
	if (!emptyCell) return startingBoard

	for (num of shuffle(numArray)) {
		counter++
		if (counter > 20_000_000) throw new Error ("Recursion Timeout")

		if (safeToPlace( startingBoard, emptyCell, num)) {
			startingBoard[ emptyCell.rowIndex ][ emptyCell.colIndex ] = num

			if (fillPuzzle(startingBoard)) {return startingBoard}

			startingBoard[ emptyCell.rowIndex ][ emptyCell.colIndex ] = 0
		}
	}
	return false
}

const newSolvedBoard = _ => {
	const newBoard = BLANK_BOARD.map(row => row.slice() ) // Create an unaffiliated clone of a fresh board
	fillPuzzle(newBoard) // Populate the board using backtracking algorithm
	return newBoard
}

// generate playable board
const pokeHoles = (startingBoard, holes) => {
	const removedVals = []
  
	while (removedVals.length < holes) {
	  const val = Math.floor(Math.random() * 81) // Value between 0-81
	  const randomRowIndex = Math.floor(val / 9) // Integer 0-8 for row index
	  const randomColIndex = val % 9 
  
	  if (!startingBoard[ randomRowIndex ]) continue // guard against cloning error
	  if ( startingBoard[ randomRowIndex ][ randomColIndex ] == 0 ) continue // If cell already empty, restart loop
	  
	  removedVals.push({  // Store the current value at the coordinates
		rowIndex: randomRowIndex, 
		colIndex: randomColIndex, 
		val: startingBoard[ randomRowIndex ][ randomColIndex ] 
	  })
	  startingBoard[ randomRowIndex ][ randomColIndex ] = 0 // "poke a hole" in the board at the coords
	  const proposedBoard = startingBoard.map ( row => row.slice() ) // Clone this changed board
	  
	  // Attempt to solve the board after removing value. If it cannot be solved, restore the old value.
	  // and remove that option from the list
	  if ( !fillPuzzle( proposedBoard ) ) {  
		startingBoard[ randomRowIndex ][ randomColIndex ] = removedVals.pop().val 
	  }
	}
	return [removedVals, startingBoard]
}

// initalize board
function newStartingBoard  (holes) {
	// Reset global iteration counter to 0 and Try to generate a new game. 
	// If counter reaches its maximum limit in the fillPuzzle function, current attemp will abort
	// To prevent the abort from crashing the script, the error is caught and used to re-run
	// this function
	try {
	  counter = 0
	  let solvedBoard = newSolvedBoard()  
  
	  // Clone the populated board and poke holes in it. 
	  // Stored the removed values for clues
	  let [removedVals, startingBoard] = pokeHoles( solvedBoard.map ( row => row.slice() ), holes)
  
	  return [removedVals, startingBoard, solvedBoard]
	  
	} catch (error) {
	  return newStartingBoard(holes)
	}
}

function multiplePossibleSolutions (boardToCheck) {
	const possibleSolutions = []
	const emptyCellArray = emptyCellCoords(boardToCheck)
	for (let index = 0; index < emptyCellArray.length; index++) {
	  // Rotate a clone of the emptyCellArray by one for each iteration
	  emptyCellClone = [...emptyCellArray]
	  const startingPoint = emptyCellClone.splice(index, 1);
	  emptyCellClone.unshift( startingPoint[0] ) 
	  thisSolution = fillFromArray( boardToCheck.map( row => row.slice() ) , emptyCellClone)
	  possibleSolutions.push( thisSolution.join() )
	  if (Array.from(new Set(possibleSolutions)).length > 1 ) return true
	}
	return false
  }
  
  // This will attempt to solve the puzzle by placing values into the board in the order that
  // the empty cells list presents
function fillFromArray(startingBoard, emptyCellArray) {
	const emptyCell = nextStillEmptyCell(startingBoard, emptyCellArray)
	if (!emptyCell) return startingBoard
	for (num of shuffle(numArray) ) {   
	  pokeCounter++
	  if ( pokeCounter > 60_000_000 ) throw new Error ("Poke Timeout")
	  if ( safeToPlace( startingBoard, emptyCell, num) ) {
		startingBoard[ emptyCell.rowIndex ][ emptyCell.colIndex ] = num 
		if ( fillFromArray(startingBoard, emptyCellArray) ) return startingBoard 
		startingBoard[ emptyCell.rowIndex ][ emptyCell.colIndex ] = 0 
	  }
	}
	return false
}
  
  // As numbers get placed, not all of the initial cells are still empty.
  // This will find the next still empty cell in the list
function nextStillEmptyCell (startingBoard, emptyCellArray) {
	for (coords of emptyCellArray) {
	  if (startingBoard[ coords.row ][ coords.col ] === 0) return {rowIndex: coords.row, colIndex: coords.col}
	}
	return false
}
  
  // Generate array from range, inclusive of start & endbounds.
const range = (start, end) => {
	const length = end - start + 1
	return Array.from( {length} , ( _ , i) => start + i)
}
  
  // Get a list of all empty cells in the board from top-left to bottom-right
function emptyCellCoords (startingBoard) {
	const listOfEmptyCells = []
	for (const row of range(0,8)) {
	  for (const col of range(0,8) ) {
		if (startingBoard[row][col] === 0 ) listOfEmptyCells.push( {row, col } )
	  }
	}
	return listOfEmptyCells
}

// generate the Sudoku board based on difficulty
function generateSudoku(difficulty) {
	let diff = 0;
	if (difficulty.toLowerCase() == "easy") {
		diff = 38;
	} else if (difficulty.toLowerCase() == "medium") {
		diff = 36;
	} else if (difficulty.toLowerCase() == "hard") {
		diff = 32;
	}

    const [removedVals, startingBoard, solvedBoard] = newStartingBoard(diff);
	

    const boardContainer = document.getElementById('board-container');
    boardContainer.innerHTML = '';

	// mistakeCounter = 0;

    for (let i = 0; i < 9; i++) {
		for (let j = 0; j < 9; j++) {
			const cell = document.createElement('div');
			cell.classList.add('cell');
			const value = startingBoard[i][j] !== 0 ? startingBoard[i][j] : '';
			cell.textContent = value;
			cell.dataset.row = i;
			cell.dataset.col = j;
			cell.contentEditable = startingBoard[i][j] === 0 ? 'true' : 'false'; // Ensure it's a string
			console.log(mistakeCounter);
			
			// Add an event listener for input changes
			cell.addEventListener('input', function() {
				checkInput(this, solvedBoard[i][j], startingBoard[i][j], mistakeCounter);
			});


			boardContainer.appendChild(cell);
		}
	}
}


function checkInput(cell, correctValue, initialValue, mistakeCounter) {
    const userInput = cell.textContent.trim();
    
    if (userInput !== '' && userInput !== correctValue.toString()) {
        // Incorrect input
        cell.style.color = 'red';
        mistakeCounter++;
        updateMistakeCounter(mistakeCounter);
    } else {
        // Correct input or empty cell
        cell.style.color = ''; // Reset color
    }
}

function updateMistakeCounter(mistakeCounter) {
    const mistakeCounterElement = document.getElementById('mistake-counter');
    mistakeCounterElement.textContent = `Mistakes: ${mistakeCounter}`;
}

// Function to prompt the user for difficulty and start the game
function startGame() {
    const difficulty = prompt("Choose a difficulty level: easy, medium, or hard");
    
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
        generateSudoku(difficulty.toLowerCase());
    } else {
        alert("Invalid difficulty level. Please choose easy, medium, or hard.");
    }
}

// Call startGame() initially to prompt the user for difficulty
startGame();
