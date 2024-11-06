import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Read operation for all users
let getAllUserAsync = async () => {
    let users = await prisma.user.findMany();
    return users;
}

// Read operation for a user by id
let getUserAsync = async (id) => {
    // Ensure id is an integer
    id = parseInt(id, 10);

    const user = await prisma.user.findUnique({
        where: { id: id }
    });

    return user || null; // Return null if user is not found
};

// Read operation for a user by email
let findUserByEmail = async (email) => {
   
    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    return user || null; // Return null if user is not found
};


// Handle POST Request (Create a new user)
let createUserAsync = async (userData) => {
    

    const gender = userData.gender;
    const validGenders = ["Male", "Female"];

    if (!validGenders.includes(gender)) {
        throw new Error("Invalid gender value. Expected Male or Female");
    }

    // Create the new user in the database with `isVerified` set to false and save the verification code
    const newUser = await prisma.user.create({
        data: {
            F_name: userData.F_name,
            L_name: userData.L_name,
            email: userData.email,
            gender: gender,
            password: userData.password,  // Ensure password is hashed in a real implementation
            status: "Active", // Setting initial status
            isVerified: false,
            verificationCode: userData.verificationCode
        }
    });

    return newUser;
};

// Update a user
let updateUserAsync = async (id, updatedData) => {

    // check if user exists
    let user = await getUserAsync(id);
    
    if (!user) {
        throw new Error ('User does not exist');
    }
    
    // Update only the first name (F_name) in the user data
    const updatedUser = await prisma.user.update({
        where: { id: id }, // Ensure userId is passed as an integer
        data: {
            F_name: updatedData.F_name,     // Updating first name
            L_name: updatedData.L_name,     // Updating last name
            email: updatedData.email,       // Updating email
        }
    });

    return updatedUser;
}

    
//Handle delete for a user
let deleteUserAsync = async (id, status) => {

    // Delete the Account with the specified userId
    const deletedAccount = await prisma.user.update({
        where: { id: id },
        data: { status }
    });
    
    return deletedAccount;
}

// Change User Password
let changePasswordAsync = async (id, oldPassword, newPassword) => {
    // Check if user exists
    let user = await prisma.user.findUnique({
        where: { id: id },
    });

    if (!user) {
        throw new Error('User does not exist');
    }

    // Validate old password
    if (user.password !== oldPassword) {
        throw new Error('Old password is incorrect');
    }

    // Update the password
    const updatedUser = await prisma.user.update({
        where: { id: id },
        data: { password: newPassword }, // new password updated
    });

    return updatedUser;
};

const userController = 
{createUserAsync,
    getAllUserAsync, 
    getUserAsync, 
    findUserByEmail,
    updateUserAsync, 
    deleteUserAsync, changePasswordAsync 
};
export default userController;


