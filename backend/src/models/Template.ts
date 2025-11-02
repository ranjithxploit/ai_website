import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISection {
  name: string; // e.g., "OBJECTIVE", "CONTENT", "REFERENCES"
  placeholder: string; // e.g., "{{OBJECTIVE}}"
  required: boolean;
}

export interface ITemplate extends Document {
  userId: mongoose.Types.ObjectId;
  filename: string; // Stored filename (UUID)
  originalName: string; // Original uploaded filename
  fileType: 'pdf' | 'docx';
  filePath: string; // Full path to stored file
  fileSize: number;
  sections: ISection[];
  pageCount: number;
  metadata: {
    uploadedAt: Date;
    lastUsed?: Date;
    timesUsed: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const sectionSchema = new Schema<ISection>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    placeholder: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const templateSchema = new Schema<ITemplate>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    sections: [sectionSchema],
    pageCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    metadata: {
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      lastUsed: {
        type: Date,
      },
      timesUsed: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
templateSchema.index({ userId: 1, createdAt: -1 });
templateSchema.index({ filename: 1 });

const Template: Model<ITemplate> = mongoose.model<ITemplate>('Template', templateSchema);

export default Template;
