/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "ADMIN",
  STUDENT = "STUDENT"
}

export enum BookStatus {
  AVAILABLE = "AVAILABLE",
  ISSUED = "ISSUED",
  RESERVED = "RESERVED",
  LOST = "LOST"
}

export enum BorrowStatus {
  ISSUED = "ISSUED",
  RETURNED = "RETURNED",
  OVERDUE = "OVERDUE"
}

export enum ReservationStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string; // Excluded in normal transfers
  studentId?: string; // Only for students
  phone?: string;
  department?: string;
  admissionNo?: string;
  status: "ACTIVE" | "INACTIVE";
  createdDate: string;
}

export interface Book {
  id: string; // Book ID
  isbn: string;
  barcode: string;
  qrCode: string;
  title: string;
  subtitle: string;
  authorId: string;
  authorName: string;
  publisherId: string;
  publisherName: string;
  categoryId: string;
  categoryName: string;
  edition: string;
  language: string;
  numberOfPages: number;
  price: number;
  quantity: number;
  availableCopies: number;
  shelfNumber: string;
  rackNumber: string;
  description: string;
  coverImage: string;
  status: BookStatus;
  createdDate: string;
  updatedDate: string;
}

export interface Author {
  id: string;
  name: string;
  biography: string;
  birthDate?: string;
  createdDate: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdDate: string;
}

export interface Publisher {
  id: string;
  name: string;
  address: string;
  phone: string;
  createdDate: string;
}

export interface BorrowRecord {
  id: string; // Borrow ID
  studentId: string;
  studentName: string;
  studentEmail: string;
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: BorrowStatus;
  fineAmount: number;
  finePaid?: boolean;
}

export interface Reservation {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  bookTitle: string;
  bookCover?: string;
  reservationDate: string;
  status: ReservationStatus;
}

export interface Review {
  id: string;
  bookId: string;
  studentName: string;
  rating: number; // 1-5
  comment: string;
  createdDate: string;
}

export interface WishlistItem {
  id: string;
  studentId: string;
  bookId: string;
  bookTitle: string;
  authorName: string;
  bookCover?: string;
  addedDate: string;
}

export interface Notification {
  id: string;
  userId: string; // "ALL" or specific user ID
  title: string;
  message: string;
  isRead: boolean;
  createdDate: string;
}

export interface Fine {
  id: string;
  borrowId: string;
  studentId: string;
  studentName: string;
  bookTitle: string;
  amount: number;
  daysOverdue: number;
  status: "UNPAID" | "PAID";
  createdDate: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
