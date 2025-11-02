import mongoose, { Document, Schema, Model } from 'mongoose';

export type FormatStyle = 'bullets' | 'bullets-paragraph' | 'paragraph';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IGeneratedSection {
  sectionName: string;
  content: string;
  wordCount: number;
}

export interface ITopic {
  name: string;
  style: FormatStyle;
}

export interface IDocument extends Document {
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  topics: ITopic[];
  requestedPages: number;
  generatedContent: IGeneratedSection[];
  status: DocumentStatus;
  filePathDocx?: string;
  filePathPdf?: string;
  filenameDocx?: string;
  filenamePdf?: string;
  metadata: {
    totalWordCount: number;
    generationTimeMs: number;
    error?: string;
  };
  createdAt: Date;
  completedAt?: Date;
}

const topicSchema = new Schema<ITopic>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    style: {
      type: String,
      enum: ['bullets', 'bullets-paragraph', 'paragraph'],
      required: true,
    },
  },
  { _id: false }
);

const generatedSectionSchema = new Schema<IGeneratedSection>(
  {
    sectionName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    wordCount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const documentSchema = new Schema<IDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'Template',
      required: true,
      index: true,
    },
    topics: {
      type: [topicSchema],
      required: true,
      validate: {
        validator: function (v: ITopic[]) {
          return v && v.length > 0 && v.length <= 10;
        },
        message: 'Must provide between 1 and 10 topics',
      },
    },
    requestedPages: {
      type: Number,
      required: true,
      min: [1, 'Must request at least 1 page'],
      max: [50, 'Cannot request more than 50 pages'],
    },
    generatedContent: [generatedSectionSchema],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    filePathDocx: {
      type: String,
    },
    filePathPdf: {
      type: String,
    },
    filenameDocx: {
      type: String,
    },
    filenamePdf: {
      type: String,
    },
    metadata: {
      totalWordCount: {
        type: Number,
        default: 0,
      },
      generationTimeMs: {
        type: Number,
        default: 0,
      },
      error: {
        type: String,
      },
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ status: 1 });
documentSchema.index({ userId: 1, status: 1 });

const Document: Model<IDocument> = mongoose.model<IDocument>('Document', documentSchema);

export default Document;
