const mongoose = require('mongoose');
const Seat = require('./models/seat');

const initializeSeats = async () => {
  try {
    // Check if seats already exist
    const seatCount = await Seat.countDocuments();
    if (seatCount > 0) {
      console.log('Seats already exist. Initialization skipped.');
      return;
    }

    // Add 80 seats
    const seats = [];
    for (let i = 1; i <= 80; i++) {
      const rowNumber = Math.ceil(i / 7);
      seats.push({ seatNumber: i, rowNumber, isBooked: false });
    }

    await Seat.insertMany(seats);
    console.log('80 seats have been added to the database.');
  } catch (error) {
    console.error('Error initializing seats:', error);
  }
};

module.exports = initializeSeats;
