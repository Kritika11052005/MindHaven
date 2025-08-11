import mongoose,{Document,Schema} from 'mongoose'
export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        resetPasswordToken: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null },
    },
    { timestamps: true }
);
export const User=mongoose.model<IUser>("User",UserSchema);
