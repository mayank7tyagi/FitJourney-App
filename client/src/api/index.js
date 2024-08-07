import axios from "axios";

// Configure the base URL for the API
const API = axios.create({
  baseURL: "https://fitjourney-app.onrender.com/api/", // Change this URL to the deployed server URL when needed
});

/**
 * User Signup
 * Sends a POST request to the /user/signup endpoint to register a new user
 * @param {Object} data - User signup data
 * @returns {Promise} - Axios promise
 */
export const UserSignUp = async (data) => {
  try {
    return await API.post("/user/signup", data);
  } catch (error) {
    console.error("Error during user signup:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * User Signin
 * Sends a POST request to the /user/signin endpoint to log in a user
 * @param {Object} data - User signin data
 * @returns {Promise} - Axios promise
 */
export const UserSignIn = async (data) => {
  try {
    return await API.post("/user/signin", data);
  } catch (error) {
    console.error("Error during user signin:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get Dashboard Details
 * Sends a GET request to the /user/dashboard endpoint to fetch user dashboard details
 * @param {String} token - User's authentication token
 * @returns {Promise} - Axios promise
 */
export const getDashboardDetails = async (token) => {
  try {
    const response =  await API.get("/user/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response);
    if(response)return response;
  } catch (error) {
    console.error("Error fetching dashboard details:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get Workouts by Date
 * Sends a GET request to the /user/workout endpoint to fetch workouts for a specific date
 * @param {String} token - User's authentication token
 * @param {String} date - Date string for fetching workouts (optional)
 * @returns {Promise} - Axios promise
 */
export const getWorkouts = async (token, date) => {
  try {
    const response =  await API.get(`/user/workout?date=${date}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response);
    if(response)return response;
  } catch (error) {
    console.error("Error fetching workouts:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Add Workout
 * Sends a POST request to the /user/workout endpoint to add a new workout
 * @param {String} token - User's authentication token
 * @param {Object} data - Workout data
 * @returns {Promise} - Axios promise
 */
export const addWorkout = async (token, data) => {
  try {
    const response = await API.post("/user/workout", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response);
    if(response)return response;

  } catch (error) {
    console.error("Error adding workout:", error.response?.data || error.message);
    throw error;
  }
};
