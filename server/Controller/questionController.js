const { json, query } = require("express"); // Import necessary modules from Express
const dbConnection = require("../db/dbconfig"); // Import the database connection configuration
const { StatusCodes } = require("http-status-codes"); // Import HTTP status codes for response handling
const { v4: uuidv4 } = require("uuid"); // Import UUID generator for unique question IDs

// Function to handle creating a new question
async function question(req, res) {
  const { title, description } = req.body; // Destructure title and description from request body

  // Validate input: Check if title and description are provided
  const questionid = uuidv4(); // Generate a unique question ID
  if (!title || !description) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide all required information" }); // Respond with a 400 error if input is invalid
  }

  // Validate title length
  if (title.length > 200) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Title must be less than 200 characters" }); // Respond with a 400 error if title is too long
  }

  try {
    // Get user information from the request (assuming authentication middleware populates req.user)
    const username = req.user.username; // User's username
    const userid = req.user.userid; // User's ID

    // Check for duplicate question ID
    const [existingQuestion] = await dbConnection.query(
      "SELECT * FROM questions WHERE questionid = ?",
      [questionid]
    );
    if (existingQuestion.length > 0) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ msg: "Question ID already exists" }); // Respond with a 409 error if question ID is not unique
    }

    // Insert the new question into the database
    await dbConnection.query(
      "INSERT INTO questions (questionid, userid, title, description) VALUES (?, ?, ?, ?)",
      [questionid, userid, title, description]
    );

    return res
      .status(StatusCodes.CREATED)
      .json({ msg: "Question added", questionid }); // Respond with a 201 status and the new question ID
  } catch (error) {
    console.error("Error adding question:", error); // Log any errors for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong, try again later" }); // Respond with a 500 error if something goes wrong
  }
}

// Function to retrieve all questions
async function Allquestion(req, res) {
  try {
    // Query the database for all questions and their associated user information
    const [results] = await dbConnection.query(
      `SELECT 
          questions.questionid AS question_id, 
          questions.title, 
          questions.description AS content, 
          users.username AS user_name 
      FROM questions 
      JOIN users ON questions.userid = users.userid 
      ORDER BY questions.id DESC`
    );
    return res.status(StatusCodes.OK).json({ questions: results }); // Respond with a 200 status and the list of questions
  } catch (error) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ msg: "No questions found" }); // Respond with a 404 error if no questions are found
  }
}

// Function to retrieve a single question by its ID
async function getSingleQuestion(req, res) {
  const { question_id } = req.params; // Extract question ID from request parameters

  // Validate input: Ensure a question ID is provided
  if (!question_id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide a question ID." }); // Respond with a 400 error if ID is missing
  }

  try {
    // Query the database for the specific question
    const [question] = await dbConnection.query(
      "SELECT questionid, title, description, created_at, userid FROM questions WHERE questionid = ?",
      [question_id]
    );

    // If no question is found, respond with an error
    if (question.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No question found with this ID." }); // Respond with a 404 error if question does not exist
    }

    return res.status(StatusCodes.OK).json({ question: question[0] }); // Respond with the question data
  } catch (error) {
    console.error("Error while retrieving question:", error.message); // Log any errors
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong, please try again!" }); // Respond with a 500 error if something goes wrong
  }
}

// Export the functions for use in other modules
module.exports = { question, Allquestion, getSingleQuestion };
