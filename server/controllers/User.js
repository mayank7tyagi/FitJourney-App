import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";

dotenv.config();

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name, img } = req.body;

    // Validate the input
    if (!email || !password || !name) {
      return next(createError(400, "Missing required fields: email, password, and name are required"));
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }

    // Generate salt and hash password
    const salt = bcrypt.genSaltSync(10); // Generate salt with a default rounds of 10
    if (!salt) {
      return next(createError(500, "Failed to generate salt"));
    }

    // Check if password is not undefined
    if (!password) {
      return next(createError(400, "Password is required"));
    }
    
    const hashedPassword = bcrypt.hashSync(password, salt); // Hash password with salt

    // Create a new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      img,
    });
    
    const createdUser = await user.save(); // Save user to the database

    // Generate a JWT token
    const token = jwt.sign({ id: createdUser._id }, process.env.JWT, {
      expiresIn: "9999 years",
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("Error during user registration:", error); // Log detailed error
    return next(createError(500, "Internal Server Error")); // Return a generic error message
  }
};


export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate the input
    if (!email || !password) {
      return next(createError(400, "Email and password are required"));
    }

    // Find the user by email
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // Check if the password is correct
    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT, {
      expiresIn: "9999 years",
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("Error during user login:", error); // Log detailed error
    return next(createError(500, "Internal Server Error")); // Return a generic error message
  }
};


export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.id; // Extract user ID from request
    const user = await User.findById(userId); // Find user by ID

    if (!user) {
      return next(createError(404, "User not found")); // If user not found, return 404
    }

    const currentDateFormatted = new Date();
    const startToday = new Date(
      currentDateFormatted.getFullYear(),
      currentDateFormatted.getMonth(),
      currentDateFormatted.getDate()
    );
    const endToday = new Date(
      currentDateFormatted.getFullYear(),
      currentDateFormatted.getMonth(),
      currentDateFormatted.getDate() + 1
    );

    // Calculate total calories burnt for today
    const totalCaloriesBurnt = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: null,
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    // Calculate total number of workouts for today
    const totalWorkouts = await Workout.countDocuments({
      user: userId,
      date: { $gte: startToday, $lt: endToday },
    });

    // Calculate average calories burnt per workout for today
    const avgCaloriesBurntPerWorkout =
      totalWorkouts > 0
        ? totalCaloriesBurnt[0].totalCaloriesBurnt / totalWorkouts
        : 0;

    // Fetch category-wise calories burnt for today
    const categoryCalories = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: "$category",
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    // Format category data for pie chart
    const pieChartData = categoryCalories.map((category, index) => ({
      id: index,
      value: category.totalCaloriesBurnt,
      label: category._id,
    }));

    // Calculate weekly calories burnt
    const weeks = [];
    const caloriesBurnt = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        currentDateFormatted.getTime() - i * 24 * 60 * 60 * 1000
      );
      weeks.push(`${date.getDate()}th`);

      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      const weekData = await Workout.aggregate([
        {
          $match: {
            user: user._id,
            date: { $gte: startOfDay, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalCaloriesBurnt: { $sum: "$caloriesBurned" },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by date in ascending order
        },
      ]);

      caloriesBurnt.push(
        weekData[0]?.totalCaloriesBurnt ? weekData[0]?.totalCaloriesBurnt : 0
      );
    }

    return res.status(200).json({
      totalCaloriesBurnt:
        totalCaloriesBurnt.length > 0
          ? totalCaloriesBurnt[0].totalCaloriesBurnt
          : 0,
      totalWorkouts: totalWorkouts,
      avgCaloriesBurntPerWorkout: avgCaloriesBurntPerWorkout,
      totalWeeksCaloriesBurnt: {
        weeks: weeks,
        caloriesBurned: caloriesBurnt,
      },
      pieChartData: pieChartData,
    });
  } catch (err) {
    next(err); // Pass errors to the error handling middleware
  }
};

/**
 * Get workouts by date.
 * This function fetches workouts for a given date and calculates total calories burnt.
 */
export const getWorkoutsByDate = async (req, res, next) => {
  try {
    const userId = req.user?.id; // Extract user ID from request
    const user = await User.findById(userId); // Find user by ID
    let date = req.query.date ? new Date(req.query.date) : new Date(); // Parse date from query, default to today

    if (!user) {
      return next(createError(404, "User not found")); // If user not found, return 404
    }

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    // Find workouts for the specified date
    const todaysWorkouts = await Workout.find({
      userId: userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    // Calculate total calories burnt for the day
    const totalCaloriesBurnt = todaysWorkouts.reduce(
      (total, workout) => total + workout.caloriesBurned,
      0
    );

    return res.status(200).json({ todaysWorkouts, totalCaloriesBurnt });
  } catch (err) {
    next(err); // Pass errors to the error handling middleware
  }
};


// /**
//  * Add workout.
//  * This function adds workouts based on a given workout string.
//  * It parses the workout string, calculates calories burnt, and saves the workouts to the database.
//  */
export const addWorkout = async (req, res, next) => {
  try {
    const userId = req.user?.id; // Extract user ID from request
    const { workoutString } = req.body; // Extract workout string from request body

    if (!workoutString) {
      return next(createError(400, "Workout string is missing")); // If workout string is missing, return 400
    }

    // Split workout string into lines
    const eachworkout = workoutString.split(";").map((line) => line.trim());
    const categories = eachworkout.filter((line) => line.startsWith("#"));

    if (categories.length === 0) {
      return next(createError(400, "No categories found in workout string")); // If no categories found, return 400
    }

    const parsedWorkouts = [];
    let currentCategory = "";
    let count = 0;

    // Loop through each line to parse workout details
    eachworkout.forEach((line) => {
      count++;
      if (line.startsWith("#")) {
        const parts = line.split("\n").map((part) => part.trim());
        if (parts.length < 5) {
          return next(
            createError(400, `Workout string is missing for ${count}th workout`)
          );
        }

        // Update current category
        currentCategory = parts[0].substring(1).trim();

        // Extract workout details
        const workoutDetails = parseWorkoutLine(parts);
        if (workoutDetails == null) {
          return next(createError(400, "Please enter in proper format "));
        }

        if (workoutDetails) {
          // Add category to workout details
          workoutDetails.category = currentCategory;
          parsedWorkouts.push(workoutDetails);
        }
      } else {
        return next(
          createError(400, `Workout string is missing for ${count}th workout`)
        );
      }
    });

    // Calculate calories burnt for each workout and save to database
    for (const workout of parsedWorkouts) {
      workout.caloriesBurned = parseFloat(calculateCaloriesBurnt(workout));
      try {
        await Workout.create({ ...workout, user: userId });
      } catch (err) {
        if (err instanceof mongoose.Error.ValidationError) {
          return next(createError(400, err.message));
        } else if (err.code === 11000) { // Handle duplicate key error
          return next(createError(400, `Duplicate key error: ${err.message}`));
        } else {
          return next(err);
        }
      }
    }

    return res.status(201).json({
      message: "Workouts added successfully",
      workouts: parsedWorkouts,
    });
  } catch (err) {
    next(err); // Pass errors to the error handling middleware
  }
};

/**
 * Parse workout details from a line.
 * This function extracts workout details from a given line.
 */
const parseWorkoutLine = (parts) => {
  const details = {};
  if (parts.length >= 5) {
    details.workoutName = parts[1].substring(1).trim();
    details.sets = parseInt(parts[2].split("sets")[0].substring(1).trim());
    details.reps = parseInt(
      parts[2].split("sets")[1].split("reps")[0].substring(1).trim()
    );
    details.weight = parseFloat(parts[3].split("kg")[0].substring(1).trim());
    details.duration = parseFloat(parts[4].split("min")[0].substring(1).trim());
    return details;
  }
  return null;
};

/**
 * Calculate calories burnt for a workout.
 * This function calculates calories burnt based on workout details.
 */
const calculateCaloriesBurnt = (workoutDetails) => {
  const durationInMinutes = parseInt(workoutDetails.duration);
  const weightInKg = parseInt(workoutDetails.weight);
  const caloriesBurntPerMinute = 5; // Sample value, actual calculation may vary
  return durationInMinutes * caloriesBurntPerMinute * weightInKg;
};