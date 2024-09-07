const express = require('express');
const Seat = require('../models/seat');
const router = express.Router();

// Get all seats
router.get('/seats', async (req, res) => {
  try {
    const seats = await Seat.find();
    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Book seats row-wise
router.post('/seats/book', async (req, res) => {
  const { numberOfSeats } = req.body;

  try {
    // Fetch available seats, sorted by rowNumber and seatNumber
    const availableSeats = await Seat.find({ isBooked: false })
      .sort({ rowNumber: 1, seatNumber: 1 });

    let seatsToBook = [];
    let remainingSeats = numberOfSeats;

    // Step 1: Try to book seats row-wise
    let currentRow = null;
    let currentRowSeats = [];

    for (const seat of availableSeats) {
      if (currentRow === null) {
        currentRow = seat.rowNumber;
      }

      if (seat.rowNumber === currentRow) {
        // Accumulate seats from the current row
        currentRowSeats.push(seat);
      } else {
        // Process the previous row
        if (currentRowSeats.length >= numberOfSeats) {
          seatsToBook = currentRowSeats.slice(0, numberOfSeats);
          remainingSeats -= seatsToBook.length;
          break;
        } else {
          seatsToBook.push(...currentRowSeats);
          remainingSeats -= currentRowSeats.length;
          currentRowSeats = [];
          currentRow = seat.rowNumber;
          currentRowSeats.push(seat);
        }
      }
    }

    // Handle any remaining seats after processing all available rows
    if (remainingSeats > 0 && currentRowSeats.length > 0) {
      if (currentRowSeats.length >= remainingSeats) {
        seatsToBook.push(...currentRowSeats.slice(0, remainingSeats));
      } else {
        seatsToBook.push(...currentRowSeats);
      }
    }

    // If not enough seats were found, return an error
    if (seatsToBook.length < numberOfSeats) {
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    // Extract seat numbers for booking
    const seatNumbersToBook = seatsToBook.map(seat => seat.seatNumber);

    // Step 2: Mark the selected seats as booked
    await Seat.updateMany({ seatNumber: { $in: seatNumbersToBook } }, { isBooked: true });

    res.json({ bookedSeats: seatNumbersToBook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Add seats manually
// Reset all booked seats to available
router.post('/seats/reset', async (req, res) => {
  try {
    // Update all booked seats (isBooked: true) to available (isBooked: false)
    await Seat.updateMany({ isBooked: true }, { isBooked: false });

    res.json({ message: 'All seats have been reset to available.' });
  } catch (error) {
    console.error('Error resetting seats:', error);
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;
