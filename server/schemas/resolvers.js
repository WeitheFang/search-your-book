//import AuthenticationError from apollo-server-express
const { AuthenticationError } = require("apollo-server-express");
//import User models
const { User } = require("../models");
//import signToken function from auth.js
const { signToken } = require("../utils/auth");

//define resolvers
const resolvers = {
  Query: {
    //me query
    me: async (parent, args, context) => {
      // use context.user so that we can retrieve the logged in user without specifically searching for them
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id }).select(
          "-__v -password"
        );

        return userData;
      }
      throw new AuthenticationError("No user found! Please log in.");
    },
  },
  Mutation: {
    //login mutation
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("No user found with this email address");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect Password!");
      }

      const token = signToken(user);
      return { token, user };
    },

    //addUser mutation
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    //saveBook mutation
    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: bookData } },
          { new: true }
        ).populate("books");
        return updatedUser;
      }
      throw new AuthenticationError("You need to be logged in!");
    },

    //removeBook mutation
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        );
        return updatedUser;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },
};
