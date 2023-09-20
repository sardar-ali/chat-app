
const express = require('express');
const bcrypt = require("bcrypt")
const cors = require('cors');
const jwt = require('jsonwebtoken');
const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000"
  }
})

// const socketIO = require('socket.io');
const dbConnection = require('./db/dbConnection');
const User = require("./model/userModel")
const Conversation = require("./model/conversationModel")
const Message = require("./model/messagesModel")

dbConnection()

const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors({ origin: 'http://localhost:3000' }));

const port = 3004; // Replace with your desired port number

// const users = [];

// //socket connection and integration
// io.on("connection", socket => {
//   console.log("connected user", socket?.id);

//   socket?.on("addUser", id => {
//     const user = { userId: id, socketId: socket?.id }
//     const isExist = users?.find((itm) => itm?.userId === id);
//     if (!isExist) {
//       users.push(user)
//     }
//     socket.emit("getUser", users)
//   })
//   console.log("users :::", users)

//   socket?.emit("getUser", users)
// })


const generateToken = (id) => {
  return jwt.sign({ id }, "jwt-secret", { expiresIn: 24 * 60 * 60 });
}


// create or signup user   
app.post("/create-user", async (req, res) => {
  try {
    const email = req?.body?.email;

    //check if user already exist throw error
    const isExist = await User.findOne({ email });
    if (isExist) {
      return res.status(400).json({
        status: false,
        message: "Email is already exists!"
      })
    }
    const hashPassword = await bcrypt.hash(req?.body?.password, 12);
    // create new user
    const user = await User.create({ ...req.body, password: hashPassword });

    //send response back to user
    res.json({
      status: true,
      data: {
        user: {
          id: user?._id,
          fullName: user?.fullName,
          email: user?.email,
          password: user.password
          // token: generateToken(user?._id)
        },
        message: "User signup successfully!"
      }
    })

  } catch (error) {
    return res.status(404).json({
      status: false,
      error
    })
  }
})


// login users 
app.post("/login", async (req, res) => {
  try {

    const { email, password } = req?.body;

    if (!email || !password) {
      // return next(new CustomError("Email and Password are required!", 400))
      return res.status(400).json({
        status: false,
        message: "Email and Password are required!"
      })
    }

    const isUser = await User.findOne({ email }).select("+password");


    if (!isUser) {
      // return next(new CustomError("Invalid Email  or Password!", 400))
      return res.status(400).json({
        status: false,
        message: "Invalid Email  or Password!"
      })
    }

    if (!await bcrypt.compare(password, isUser?.password)) {
      // return next(new CustomError("Invalid  credentials!", 400))
      return res.status(400).json({
        status: false,
        message: "Invalid credentials!"
      })
    }

    const token = generateToken(isUser?._id)
    const updatedUser = await User.findByIdAndUpdate(
      isUser?._id,
      { token: token },
      { new: true }
    );


    //response back to user
    res.status(200).json({
      status: true,
      data: {
        user: {
          id: isUser?._id,
          fullName: isUser?.fullName,
          email: isUser?.email,
          token
        },
        message: "Logged in successfully"
      }
    })


  } catch (error) {
    return res.status(404).json({
      status: false,
      error
    })
  }
}

)

app.post("/conversation", async (req, res) => {
  try {
    const { senderId, receiverId } = req?.body;
    const members = await Conversation.create({ members: [senderId, receiverId] })
    res.status(201).json({
      status: true,
      data: {
        members
      },
      message: "Member created successfully!"
    })
  } catch (error) {
    res.status(404).json({
      status: false,
      error
    })
  }
})

// Start the server
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
