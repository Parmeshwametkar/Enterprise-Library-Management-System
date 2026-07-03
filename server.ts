/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  UserRole,
  BookStatus,
  BorrowStatus,
  ReservationStatus,
  User,
  Book,
  Author,
  Category,
  Publisher,
  BorrowRecord,
  Reservation,
  Review,
  WishlistItem,
  Notification,
  Fine,
  AuditLog
} from "./src/types.js";

// Initialize express app
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client (safely, lazy load fallback if key is missing)
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
} catch (err) {
  console.error("Failed to initialize Gemini API Client:", err);
}

// ==========================================
// SEED DATA / IN-MEMORY DATABASE
// ==========================================

let users: User[] = [
  {
    id: "U-1",
    email: "admin@library.com",
    fullName: "System Administrator",
    role: UserRole.ADMIN,
    phone: "+91 9876543210",
    status: "ACTIVE",
    createdDate: "2026-01-01"
  },
  {
    id: "U-2",
    email: "student@library.com",
    fullName: "Rohan Sharma",
    role: UserRole.STUDENT,
    studentId: "STU-2026001",
    phone: "+91 9123456789",
    department: "Computer Science",
    admissionNo: "CS-2026-08",
    status: "ACTIVE",
    createdDate: "2026-01-15"
  },
  {
    id: "U-3",
    email: "priya@library.com",
    fullName: "Priya Patel",
    role: UserRole.STUDENT,
    studentId: "STU-2026002",
    phone: "+91 9345678120",
    department: "Information Technology",
    admissionNo: "IT-2026-44",
    status: "ACTIVE",
    createdDate: "2026-02-10"
  }
];

// Helper to simulate simple password verify (hash-free for state simplicity)
const userPasswords: Record<string, string> = {
  "admin@library.com": "admin123",
  "student@library.com": "student123",
  "priya@library.com": "priya123"
};

let authors: Author[] = [
  { id: "A-1", name: "Joshua Bloch", biography: "Software engineer and author, formerly at Sun Microsystems and Google. He led the design and implementation of numerous Java platform features.", birthDate: "1961-08-28", createdDate: "2026-01-01" },
  { id: "A-2", name: "Robert C. Martin", biography: "Known colloquially as 'Uncle Bob', is an American software engineer and author. He is a co-author of the Agile Manifesto.", birthDate: "1952-12-05", createdDate: "2026-01-01" },
  { id: "A-3", name: "Martin Fowler", biography: "British software developer, author and international public speaker on software development, specializing in object-oriented analysis and design.", birthDate: "1963-12-18", createdDate: "2026-01-01" },
  { id: "A-4", name: "Kathy Sierra", biography: "American game developer and instructional designer. She is co-creator of the Head First series of book for O'Reilly.", birthDate: "1957-12-12", createdDate: "2026-01-05" }
];

let categories: Category[] = [
  { id: "C-1", name: "Software Engineering", description: "Methodologies, best practices, agile development, and clean coding practices.", createdDate: "2026-01-01" },
  { id: "C-2", name: "Java Programming", description: "Core Java, Spring Framework, Spring Boot, Hibernate, JPA and enterprise development.", createdDate: "2026-01-01" },
  { id: "C-3", name: "Web Development", description: "React.js, HTML, CSS, Javascript, TypeScript, and modern full-stack engineering.", createdDate: "2026-01-02" },
  { id: "C-4", name: "Data Science & AI", description: "Machine learning, neural networks, analytics, Python, and data pipelines.", createdDate: "2026-01-02" }
];

let publishers: Publisher[] = [
  { id: "P-1", name: "Addison-Wesley Professional", address: "Boston, Massachusetts, USA", phone: "+1-617-848-1000", createdDate: "2026-01-01" },
  { id: "P-2", name: "Prentice Hall", address: "Upper Saddle River, New Jersey, USA", phone: "+1-201-236-7000", createdDate: "2026-01-01" },
  { id: "P-3", name: "O'Reilly Media", address: "Sebastopol, California, USA", phone: "+1-707-827-7000", createdDate: "2026-01-05" }
];

let books: Book[] = [
  {
    id: "B-1",
    isbn: "978-0134685991",
    barcode: "9780134685991",
    qrCode: "LMS-B-1-9780134685991",
    title: "Effective Java",
    subtitle: "Best practices for the Java Platform",
    authorId: "A-1",
    authorName: "Joshua Bloch",
    publisherId: "P-1",
    publisherName: "Addison-Wesley Professional",
    categoryId: "C-2",
    categoryName: "Java Programming",
    edition: "3rd Edition",
    language: "English",
    numberOfPages: 412,
    price: 1250,
    quantity: 10,
    availableCopies: 8,
    shelfNumber: "S-04",
    rackNumber: "R-12",
    description: "The definitive guide to Java platform best practices, fully updated for Java 9.",
    coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
    status: BookStatus.AVAILABLE,
    createdDate: "2026-01-10",
    updatedDate: "2026-01-10"
  },
  {
    id: "B-2",
    isbn: "978-0132350884",
    barcode: "9780132350884",
    qrCode: "LMS-B-2-9780132350884",
    title: "Clean Code",
    subtitle: "A Handbook of Agile Software Craftsmanship",
    authorId: "A-2",
    authorName: "Robert C. Martin",
    publisherId: "P-2",
    publisherName: "Prentice Hall",
    categoryId: "C-1",
    categoryName: "Software Engineering",
    edition: "1st Edition",
    language: "English",
    numberOfPages: 464,
    price: 1450,
    quantity: 8,
    availableCopies: 7,
    shelfNumber: "S-02",
    rackNumber: "R-08",
    description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
    coverImage: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
    status: BookStatus.AVAILABLE,
    createdDate: "2026-01-10",
    updatedDate: "2026-01-10"
  },
  {
    id: "B-3",
    isbn: "978-0134757599",
    barcode: "9780134757599",
    qrCode: "LMS-B-3-9780134757599",
    title: "Refactoring",
    subtitle: "Improving the Design of Existing Code",
    authorId: "A-3",
    authorName: "Martin Fowler",
    publisherId: "P-1",
    publisherName: "Addison-Wesley Professional",
    categoryId: "C-1",
    categoryName: "Software Engineering",
    edition: "2nd Edition",
    language: "English",
    numberOfPages: 448,
    price: 1550,
    quantity: 5,
    availableCopies: 4,
    shelfNumber: "S-02",
    rackNumber: "R-09",
    description: "The classic guide fully revised and updated for modern JavaScript and software design principles.",
    coverImage: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
    status: BookStatus.AVAILABLE,
    createdDate: "2026-01-12",
    updatedDate: "2026-01-12"
  },
  {
    id: "B-4",
    isbn: "978-0596009205",
    barcode: "9780596009205",
    qrCode: "LMS-B-4-9780596009205",
    title: "Head First Java",
    subtitle: "A Brain-Friendly Guide",
    authorId: "A-4",
    authorName: "Kathy Sierra",
    publisherId: "P-3",
    publisherName: "O'Reilly Media",
    categoryId: "C-2",
    categoryName: "Java Programming",
    edition: "2nd Edition",
    language: "English",
    numberOfPages: 720,
    price: 950,
    quantity: 12,
    availableCopies: 12,
    shelfNumber: "S-04",
    rackNumber: "R-15",
    description: "A complete learning experience in Java and object-oriented programming.",
    coverImage: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400",
    status: BookStatus.AVAILABLE,
    createdDate: "2026-01-15",
    updatedDate: "2026-01-15"
  }
];

let borrowRecords: BorrowRecord[] = [
  {
    id: "BR-001",
    studentId: "U-2",
    studentName: "Rohan Sharma",
    studentEmail: "student@library.com",
    bookId: "B-1",
    bookTitle: "Effective Java",
    bookCover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400",
    issueDate: "2026-06-15",
    dueDate: "2026-06-30",
    status: BorrowStatus.OVERDUE,
    fineAmount: 20 // ₹10 per day, assuming current date is 2026-07-02
  },
  {
    id: "BR-002",
    studentId: "U-2",
    studentName: "Rohan Sharma",
    studentEmail: "student@library.com",
    bookId: "B-2",
    bookTitle: "Clean Code",
    bookCover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400",
    issueDate: "2026-06-10",
    dueDate: "2026-06-25",
    returnDate: "2026-06-24",
    status: BorrowStatus.RETURNED,
    fineAmount: 0
  },
  {
    id: "BR-003",
    studentId: "U-3",
    studentName: "Priya Patel",
    studentEmail: "priya@library.com",
    bookId: "B-3",
    bookTitle: "Refactoring",
    bookCover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400",
    issueDate: "2026-06-20",
    dueDate: "2026-07-05",
    status: BorrowStatus.ISSUED,
    fineAmount: 0
  }
];

let reservations: Reservation[] = [
  {
    id: "RES-01",
    studentId: "U-2",
    studentName: "Rohan Sharma",
    bookId: "B-4",
    bookTitle: "Head First Java",
    bookCover: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=400",
    reservationDate: "2026-07-01",
    status: ReservationStatus.PENDING
  }
];

let reviews: Review[] = [
  { id: "REV-01", bookId: "B-1", studentName: "Rohan Sharma", rating: 5, comment: "Incredible book for any developer serious about mastering Java. Covers modern practices beautifully.", createdDate: "2026-06-25" },
  { id: "REV-02", bookId: "B-2", studentName: "Priya Patel", rating: 4, comment: "Must-read book for beginners. The clean code principles are timeless, though some examples are dated.", createdDate: "2026-06-28" }
];

let wishlists: WishlistItem[] = [
  { id: "W-01", studentId: "U-2", bookId: "B-3", bookTitle: "Refactoring", authorName: "Martin Fowler", addedDate: "2026-06-30" }
];

let notifications: Notification[] = [
  { id: "N-1", userId: "ALL", title: "Library Reopened", message: "The main library campus has fully reopened with extended hours: 8 AM to 10 PM daily.", isRead: false, createdDate: "2026-07-01" },
  { id: "N-2", userId: "U-2", title: "Book Overdue Alert", message: "Your issued book 'Effective Java' was due on 2026-06-30. Please return or renew it to avoid further fines.", isRead: false, createdDate: "2026-07-01" }
];

let fines: Fine[] = [
  { id: "F-1", borrowId: "BR-001", studentId: "U-2", studentName: "Rohan Sharma", bookTitle: "Effective Java", amount: 20, daysOverdue: 2, status: "UNPAID", createdDate: "2026-07-01" }
];

let auditLogs: AuditLog[] = [
  { id: "L-1", userId: "U-1", userName: "System Administrator", action: "SYSTEM_INITIALIZED", details: "Enterprise Library Management System successfully seeded with core entities.", timestamp: "2026-07-02T12:00:00-07:00" },
  { id: "L-2", userId: "U-2", userName: "Rohan Sharma", action: "USER_LOGIN", details: "Student logged into the system portal.", timestamp: "2026-07-02T14:30:22-07:00" }
];

// Helper to calculate fines dynamically based on ₹10 per day rule
function calculateFines() {
  const currentDate = new Date("2026-07-02"); // Consistent with the mock system clock
  borrowRecords.forEach(record => {
    if (record.status === BorrowStatus.ISSUED || record.status === BorrowStatus.OVERDUE) {
      const due = new Date(record.dueDate);
      if (currentDate > due) {
        const timeDiff = currentDate.getTime() - due.getTime();
        const daysOverdue = Math.floor(timeDiff / (1000 * 3600 * 24));
        if (daysOverdue > 0) {
          record.status = BorrowStatus.OVERDUE;
          record.fineAmount = daysOverdue * 10;

          // Sync with fines array
          const existingFine = fines.find(f => f.borrowId === record.id);
          if (existingFine && existingFine.status === "UNPAID") {
            existingFine.amount = record.fineAmount;
            existingFine.daysOverdue = daysOverdue;
          } else if (!existingFine) {
            fines.push({
              id: `F-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              borrowId: record.id,
              studentId: record.studentId,
              studentName: record.studentName,
              bookTitle: record.bookTitle,
              amount: record.fineAmount,
              daysOverdue: daysOverdue,
              status: "UNPAID",
              createdDate: "2026-07-02"
            });
          }
        }
      }
    }
  });
}

// Initial calculation
calculateFines();

// Helper to add audit logs
function addAuditLog(userId: string, action: string, details: string) {
  const user = users.find(u => u.id === userId);
  auditLogs.unshift({
    id: `L-${Date.now()}`,
    userId,
    userName: user ? user.fullName : "Unknown User",
    action,
    details,
    timestamp: new Date().toISOString()
  });
}

// ==========================================
// AUTH ENDPOINTS
// ==========================================

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user || userPasswords[email] !== password) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  if (user.status === "INACTIVE") {
    return res.status(403).json({ message: "Your account is inactive. Please contact the administrator." });
  }

  addAuditLog(user.id, "USER_LOGIN", `Logged in successfully from ${user.role} portal.`);
  // Generate dummy JWT-like token (payload encoded in base64 as simulation)
  const payload = JSON.stringify({ id: user.id, email: user.email, role: user.role });
  const token = Buffer.from(payload).toString("base64") + "." + "SIGNATURE_MOCK";

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
      phone: user.phone,
      department: user.department,
      admissionNo: user.admissionNo,
      status: user.status
    }
  });
});

app.post("/api/auth/register", (req, res) => {
  const { email, password, fullName, phone, department, admissionNo } = req.body;
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ message: "Email is already registered." });
  }

  const id = `U-${users.length + 1}`;
  const studentId = `STU-2026${String(users.length + 1).padStart(3, "0")}`;
  const newUser: User = {
    id,
    email,
    fullName,
    role: UserRole.STUDENT,
    studentId,
    phone: phone || "+91 9999999999",
    department: department || "General Science",
    admissionNo: admissionNo || `AD-${Date.now()}`,
    status: "ACTIVE",
    createdDate: "2026-07-02"
  };

  users.push(newUser);
  userPasswords[email] = password;

  // Add initial notifications for the registered user
  notifications.push({
    id: `N-STU-${Date.now()}`,
    userId: id,
    title: "Welcome to Library Management System!",
    message: "Your student registration was successful. Search books, add reviews, borrow materials, and manage your wishlist.",
    isRead: false,
    createdDate: "2026-07-02"
  });

  addAuditLog(id, "USER_REGISTER", `Registered new student account: ${fullName} (${email}).`);

  // Auto-login after registration
  const payload = JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role });
  const token = Buffer.from(payload).toString("base64") + "." + "SIGNATURE_MOCK";

  res.json({
    token,
    user: newUser
  });
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ message: "No registered account found with this email." });
  }
  // Simulate forgot password reset code trigger
  res.json({ message: "Password reset link and security token sent to registered email.", token: "RESET_TOKEN_123" });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, newPassword } = req.body;
  if (!users.some(u => u.email === email)) {
    return res.status(404).json({ message: "User not found." });
  }
  userPasswords[email] = newPassword;
  res.json({ message: "Password reset successfully. You can now login with your new password." });
});

app.post("/api/auth/change-password", (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }
  if (userPasswords[user.email] !== currentPassword) {
    return res.status(400).json({ message: "Current password does not match our records." });
  }

  userPasswords[user.email] = newPassword;
  addAuditLog(userId, "PASSWORD_CHANGED", "Successfully updated account password.");
  res.json({ message: "Password updated successfully." });
});

// ==========================================
// BOOKS CRUD & SEARCH API
// ==========================================

app.get("/api/books", (req, res) => {
  const { isbn, title, author, publisher, category, language, sort, order, page, limit } = req.query;

  let filteredBooks = [...books];

  // Filters
  if (isbn) {
    filteredBooks = filteredBooks.filter(b => b.isbn.toLowerCase().includes(String(isbn).toLowerCase()));
  }
  if (title) {
    filteredBooks = filteredBooks.filter(b => b.title.toLowerCase().includes(String(title).toLowerCase()));
  }
  if (author) {
    filteredBooks = filteredBooks.filter(b => b.authorName.toLowerCase().includes(String(author).toLowerCase()));
  }
  if (publisher) {
    filteredBooks = filteredBooks.filter(b => b.publisherName.toLowerCase().includes(String(publisher).toLowerCase()));
  }
  if (category) {
    filteredBooks = filteredBooks.filter(b => b.categoryName.toLowerCase().includes(String(category).toLowerCase()));
  }
  if (language) {
    filteredBooks = filteredBooks.filter(b => b.language.toLowerCase().includes(String(language).toLowerCase()));
  }

  // Sort
  if (sort) {
    const sortField = String(sort) as keyof Book;
    const isAsc = order === "asc";
    filteredBooks.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "number" && typeof valB === "number") {
        return isAsc ? valA - valB : valB - valA;
      }
      return isAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  // Pagination
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  const startIndex = (p - 1) * l;
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + l);

  res.json({
    books: paginatedBooks,
    total: filteredBooks.length,
    page: p,
    limit: l
  });
});

app.get("/api/books/:id", (req, res) => {
  const book = books.find(b => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ message: "Book not found." });
  }
  res.json(book);
});

app.post("/api/books", (req, res) => {
  const {
    isbn, title, subtitle, authorId, publisherId, categoryId,
    edition, language, numberOfPages, price, quantity, shelfNumber,
    rackNumber, description, coverImage, userId
  } = req.body;

  if (books.some(b => b.isbn === isbn)) {
    return res.status(400).json({ message: `Book with ISBN ${isbn} already exists.` });
  }

  const author = authors.find(a => a.id === authorId);
  const publisher = publishers.find(p => p.id === publisherId);
  const category = categories.find(c => c.id === categoryId);

  if (!author || !publisher || !category) {
    return res.status(400).json({ message: "Invalid author, publisher, or category association." });
  }

  const id = `B-${books.length + 1}`;
  const barcode = isbn.replace(/[^0-9]/g, "") || `BAR-${Date.now()}`;
  const qrCode = `LMS-B-${id}-${barcode}`;

  const newBook: Book = {
    id,
    isbn,
    barcode,
    qrCode,
    title,
    subtitle: subtitle || "",
    authorId,
    authorName: author.name,
    publisherId,
    publisherName: publisher.name,
    categoryId,
    categoryName: category.name,
    edition: edition || "1st Edition",
    language: language || "English",
    numberOfPages: Number(numberOfPages) || 100,
    price: Number(price) || 0,
    quantity: Number(quantity) || 1,
    availableCopies: Number(quantity) || 1,
    shelfNumber: shelfNumber || "N/A",
    rackNumber: rackNumber || "N/A",
    description: description || "",
    coverImage: coverImage || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400",
    status: BookStatus.AVAILABLE,
    createdDate: "2026-07-02",
    updatedDate: "2026-07-02"
  };

  books.push(newBook);
  addAuditLog(userId || "SYSTEM", "BOOK_ADDED", `Added new book: ${title} (ISBN: ${isbn}).`);
  res.status(201).json(newBook);
});

app.put("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const bookIndex = books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ message: "Book not found." });
  }

  const {
    isbn, title, subtitle, authorId, publisherId, categoryId,
    edition, language, numberOfPages, price, quantity, availableCopies,
    shelfNumber, rackNumber, description, coverImage, status, userId
  } = req.body;

  const author = authors.find(a => a.id === authorId) || { name: books[bookIndex].authorName };
  const publisher = publishers.find(p => p.id === publisherId) || { name: books[bookIndex].publisherName };
  const category = categories.find(c => c.id === categoryId) || { name: books[bookIndex].categoryName };

  const updatedBook: Book = {
    ...books[bookIndex],
    isbn: isbn || books[bookIndex].isbn,
    title: title || books[bookIndex].title,
    subtitle: subtitle || books[bookIndex].subtitle,
    authorId: authorId || books[bookIndex].authorId,
    authorName: author.name,
    publisherId: publisherId || books[bookIndex].publisherId,
    publisherName: publisher.name,
    categoryId: categoryId || books[bookIndex].categoryId,
    categoryName: category.name,
    edition: edition || books[bookIndex].edition,
    language: language || books[bookIndex].language,
    numberOfPages: numberOfPages !== undefined ? Number(numberOfPages) : books[bookIndex].numberOfPages,
    price: price !== undefined ? Number(price) : books[bookIndex].price,
    quantity: quantity !== undefined ? Number(quantity) : books[bookIndex].quantity,
    availableCopies: availableCopies !== undefined ? Number(availableCopies) : books[bookIndex].availableCopies,
    shelfNumber: shelfNumber || books[bookIndex].shelfNumber,
    rackNumber: rackNumber || books[bookIndex].rackNumber,
    description: description || books[bookIndex].description,
    coverImage: coverImage || books[bookIndex].coverImage,
    status: status || books[bookIndex].status,
    updatedDate: "2026-07-02"
  };

  books[bookIndex] = updatedBook;
  addAuditLog(userId || "SYSTEM", "BOOK_UPDATED", `Updated book: ${updatedBook.title}.`);
  res.json(updatedBook);
});

app.delete("/api/books/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  const bookIndex = books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ message: "Book not found." });
  }

  // Check if book is currently issued before allowing delete
  const isIssued = borrowRecords.some(b => b.bookId === id && b.status !== BorrowStatus.RETURNED);
  if (isIssued) {
    return res.status(400).json({ message: "Cannot delete book while copies are currently issued." });
  }

  const bookTitle = books[bookIndex].title;
  books.splice(bookIndex, 1);
  addAuditLog(String(userId || "SYSTEM"), "BOOK_DELETED", `Deleted book: ${bookTitle} (ID: ${id}).`);
  res.json({ message: "Book successfully deleted." });
});

// ==========================================
// AUTHOR CRUD
// ==========================================

app.get("/api/authors", (req, res) => {
  res.json(authors);
});

app.post("/api/authors", (req, res) => {
  const { name, biography, birthDate, userId } = req.body;
  const id = `A-${authors.length + 1}`;
  const newAuthor: Author = {
    id, name, biography: biography || "", birthDate: birthDate || "", createdDate: "2026-07-02"
  };
  authors.push(newAuthor);
  addAuditLog(userId || "SYSTEM", "AUTHOR_ADDED", `Created Author: ${name}`);
  res.status(201).json(newAuthor);
});

app.put("/api/authors/:id", (req, res) => {
  const author = authors.find(a => a.id === req.params.id);
  if (!author) return res.status(404).json({ message: "Author not found" });
  const { name, biography, birthDate, userId } = req.body;
  author.name = name || author.name;
  author.biography = biography || author.biography;
  author.birthDate = birthDate || author.birthDate;
  addAuditLog(userId || "SYSTEM", "AUTHOR_UPDATED", `Updated Author: ${author.name}`);
  res.json(author);
});

app.delete("/api/authors/:id", (req, res) => {
  const index = authors.findIndex(a => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Author not found" });
  const authorName = authors[index].name;
  authors.splice(index, 1);
  addAuditLog(String(req.query.userId || "SYSTEM"), "AUTHOR_DELETED", `Deleted Author: ${authorName}`);
  res.json({ message: "Author deleted" });
});

// ==========================================
// CATEGORY CRUD
// ==========================================

app.get("/api/categories", (req, res) => {
  res.json(categories);
});

app.post("/api/categories", (req, res) => {
  const { name, description, userId } = req.body;
  const id = `C-${categories.length + 1}`;
  const newCat: Category = { id, name, description: description || "", createdDate: "2026-07-02" };
  categories.push(newCat);
  addAuditLog(userId || "SYSTEM", "CATEGORY_ADDED", `Created Category: ${name}`);
  res.status(201).json(newCat);
});

app.put("/api/categories/:id", (req, res) => {
  const cat = categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ message: "Category not found" });
  const { name, description, userId } = req.body;
  cat.name = name || cat.name;
  cat.description = description || cat.description;
  addAuditLog(userId || "SYSTEM", "CATEGORY_UPDATED", `Updated Category: ${cat.name}`);
  res.json(cat);
});

app.delete("/api/categories/:id", (req, res) => {
  const index = categories.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Category not found" });
  const catName = categories[index].name;
  categories.splice(index, 1);
  addAuditLog(String(req.query.userId || "SYSTEM"), "CATEGORY_DELETED", `Deleted Category: ${catName}`);
  res.json({ message: "Category deleted" });
});

// ==========================================
// PUBLISHER CRUD
// ==========================================

app.get("/api/publishers", (req, res) => {
  res.json(publishers);
});

app.post("/api/publishers", (req, res) => {
  const { name, address, phone, userId } = req.body;
  const id = `P-${publishers.length + 1}`;
  const newPub: Publisher = { id, name, address: address || "", phone: phone || "", createdDate: "2026-07-02" };
  publishers.push(newPub);
  addAuditLog(userId || "SYSTEM", "PUBLISHER_ADDED", `Created Publisher: ${name}`);
  res.status(201).json(newPub);
});

app.put("/api/publishers/:id", (req, res) => {
  const pub = publishers.find(p => p.id === req.params.id);
  if (!pub) return res.status(404).json({ message: "Publisher not found" });
  const { name, address, phone, userId } = req.body;
  pub.name = name || pub.name;
  pub.address = address || pub.address;
  pub.phone = phone || pub.phone;
  addAuditLog(userId || "SYSTEM", "PUBLISHER_UPDATED", `Updated Publisher: ${pub.name}`);
  res.json(pub);
});

app.delete("/api/publishers/:id", (req, res) => {
  const index = publishers.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Publisher not found" });
  const pubName = publishers[index].name;
  publishers.splice(index, 1);
  addAuditLog(String(req.query.userId || "SYSTEM"), "PUBLISHER_DELETED", `Deleted Publisher: ${pubName}`);
  res.json({ message: "Publisher deleted" });
});

// ==========================================
// STUDENT WORKFLOWS (ADMIN)
// ==========================================

app.get("/api/students", (req, res) => {
  const students = users.filter(u => u.role === UserRole.STUDENT);
  res.json(students);
});

app.put("/api/students/:id", (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: "Student not found" });
  const { fullName, phone, department, admissionNo, status, userId } = req.body;

  user.fullName = fullName || user.fullName;
  user.phone = phone || user.phone;
  user.department = department || user.department;
  user.admissionNo = admissionNo || user.admissionNo;
  user.status = status || user.status;

  addAuditLog(userId || "SYSTEM", "STUDENT_UPDATED", `Updated details for student: ${user.fullName}`);
  res.json(user);
});

// ==========================================
// BORROW & FINE MODULE
// ==========================================

app.get("/api/borrows", (req, res) => {
  const { studentId } = req.query;
  calculateFines();
  let records = [...borrowRecords];
  if (studentId) {
    records = records.filter(r => r.studentId === studentId);
  }
  res.json(records);
});

// Issue Book Route (Reduces stock, makes record)
app.post("/api/borrows/issue", (req, res) => {
  const { studentId, bookId, issueDays, userId } = req.body;
  const student = users.find(u => u.id === studentId);
  const book = books.find(b => b.id === bookId);

  if (!student) return res.status(404).json({ message: "Student not found." });
  if (!book) return res.status(404).json({ message: "Book not found." });

  if (book.availableCopies <= 0) {
    return res.status(400).json({ message: "The book is currently out of stock." });
  }

  // Check if student already has this book issued currently
  const alreadyIssued = borrowRecords.some(r => r.studentId === studentId && r.bookId === bookId && r.status !== BorrowStatus.RETURNED);
  if (alreadyIssued) {
    return res.status(400).json({ message: "This book is already issued to this student." });
  }

  // Update book quantities
  book.availableCopies -= 1;
  if (book.availableCopies === 0) {
    book.status = BookStatus.ISSUED;
  }

  const days = Number(issueDays) || 14;
  const issueDate = new Date("2026-07-02");
  const dueDate = new Date();
  dueDate.setDate(issueDate.getDate() + days);

  const newBorrow: BorrowRecord = {
    id: `BR-${Date.now()}`,
    studentId: student.id,
    studentName: student.fullName,
    studentEmail: student.email,
    bookId: book.id,
    bookTitle: book.title,
    bookCover: book.coverImage,
    issueDate: issueDate.toISOString().split("T")[0],
    dueDate: dueDate.toISOString().split("T")[0],
    status: BorrowStatus.ISSUED,
    fineAmount: 0
  };

  borrowRecords.unshift(newBorrow);

  // If there was a pending reservation, clear it / complete it
  const reservation = reservations.find(r => r.studentId === studentId && r.bookId === bookId && r.status === ReservationStatus.PENDING);
  if (reservation) {
    reservation.status = ReservationStatus.COMPLETED;
  }

  // Add system notifications for the student
  notifications.unshift({
    id: `N-${Date.now()}`,
    userId: student.id,
    title: "Book Issued Successfully",
    message: `You have successfully borrowed '${book.title}'. It is due for return/renewal on ${newBorrow.dueDate}.`,
    isRead: false,
    createdDate: "2026-07-02"
  });

  addAuditLog(userId || student.id, "BOOK_ISSUED", `Issued '${book.title}' to student Rohan Sharma.`);

  res.status(201).json(newBorrow);
});

// Return Book Route (Restores stock, records return date, finalizes fine)
app.post("/api/borrows/return/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const record = borrowRecords.find(r => r.id === id);

  if (!record) return res.status(404).json({ message: "Borrow record not found." });
  if (record.status === BorrowStatus.RETURNED) {
    return res.status(400).json({ message: "Book has already been returned." });
  }

  calculateFines();

  const book = books.find(b => b.id === record.bookId);
  if (book) {
    book.availableCopies += 1;
    book.status = BookStatus.AVAILABLE;
  }

  record.returnDate = "2026-07-02";
  record.status = BorrowStatus.RETURNED;

  // Clear unpaid fine from fine catalog or mark paid
  const fine = fines.find(f => f.borrowId === id);
  if (fine && fine.status === "UNPAID") {
    fine.status = "PAID"; // Realistically, returned books resolve active fines or record them as complete
  }

  notifications.unshift({
    id: `N-${Date.now()}`,
    userId: record.studentId,
    title: "Book Returned Successfully",
    message: `You returned '${record.bookTitle}' on 2026-07-02. Thank you!`,
    isRead: false,
    createdDate: "2026-07-02"
  });

  addAuditLog(userId || record.studentId, "BOOK_RETURNED", `Returned '${record.bookTitle}' from ${record.studentName}.`);
  res.json(record);
});

// Renew Book Route (Extends due date by 14 days)
app.post("/api/borrows/renew/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const record = borrowRecords.find(r => r.id === id);

  if (!record) return res.status(404).json({ message: "Borrow record not found." });
  if (record.status === BorrowStatus.RETURNED) {
    return res.status(400).json({ message: "Cannot renew an already returned book." });
  }

  // Extend due date
  const originalDue = new Date(record.dueDate);
  originalDue.setDate(originalDue.getDate() + 14);
  record.dueDate = originalDue.toISOString().split("T")[0];
  record.status = BorrowStatus.ISSUED; // reset overdue status back if any
  record.fineAmount = 0; // reset accumulated fine since extended

  // Clean outstanding unpaid fines for this borrow
  const fineIndex = fines.findIndex(f => f.borrowId === id && f.status === "UNPAID");
  if (fineIndex !== -1) {
    fines.splice(fineIndex, 1);
  }

  notifications.unshift({
    id: `N-${Date.now()}`,
    userId: record.studentId,
    title: "Book Renewed Successfully",
    message: `Due date for '${record.bookTitle}' extended to ${record.dueDate}.`,
    isRead: false,
    createdDate: "2026-07-02"
  });

  addAuditLog(userId || record.studentId, "BOOK_RENEWED", `Renewed/Extended borrow period of '${record.bookTitle}' for ${record.studentName}.`);
  res.json(record);
});

// ==========================================
// RESERVATIONS MODULE
// ==========================================

app.get("/api/reservations", (req, res) => {
  const { studentId } = req.query;
  let resList = [...reservations];
  if (studentId) {
    resList = resList.filter(r => r.studentId === studentId);
  }
  res.json(resList);
});

app.post("/api/reservations", (req, res) => {
  const { studentId, bookId } = req.body;
  const student = users.find(u => u.id === studentId);
  const book = books.find(b => b.id === bookId);

  if (!student || !book) return res.status(404).json({ message: "Student or Book not found" });

  const activeRes = reservations.some(r => r.studentId === studentId && r.bookId === bookId && r.status === ReservationStatus.PENDING);
  if (activeRes) return res.status(400).json({ message: "You already have a pending reservation for this book." });

  const newRes: Reservation = {
    id: `RES-${Date.now()}`,
    studentId,
    studentName: student.fullName,
    bookId,
    bookTitle: book.title,
    bookCover: book.coverImage,
    reservationDate: "2026-07-02",
    status: ReservationStatus.PENDING
  };

  reservations.unshift(newRes);
  addAuditLog(studentId, "BOOK_RESERVED", `Reserved book: ${book.title}`);
  res.status(201).json(newRes);
});

app.patch("/api/reservations/:id", (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body;
  const reservation = reservations.find(r => r.id === id);

  if (!reservation) return res.status(404).json({ message: "Reservation not found." });
  reservation.status = status;

  addAuditLog(userId || reservation.studentId, "RESERVATION_UPDATED", `Updated reservation status of '${reservation.bookTitle}' to ${status}.`);
  res.json(reservation);
});

// ==========================================
// REVIEWS & RATINGS
// ==========================================

app.get("/api/reviews", (req, res) => {
  const { bookId } = req.query;
  let list = [...reviews];
  if (bookId) {
    list = list.filter(r => r.bookId === bookId);
  }
  res.json(list);
});

app.post("/api/reviews", (req, res) => {
  const { bookId, studentName, rating, comment } = req.body;
  const newReview: Review = {
    id: `REV-${Date.now()}`,
    bookId,
    studentName,
    rating: Number(rating) || 5,
    comment,
    createdDate: "2026-07-02"
  };
  reviews.unshift(newReview);
  res.status(201).json(newReview);
});

// ==========================================
// WISHLIST MODULE
// ==========================================

app.get("/api/wishlist", (req, res) => {
  const { studentId } = req.query;
  res.json(wishlists.filter(w => w.studentId === studentId));
});

app.post("/api/wishlist", (req, res) => {
  const { studentId, bookId } = req.body;
  const book = books.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ message: "Book not found" });

  const exists = wishlists.some(w => w.studentId === studentId && w.bookId === bookId);
  if (exists) return res.status(400).json({ message: "Book already in wishlist" });

  const newItem: WishlistItem = {
    id: `W-${Date.now()}`,
    studentId,
    bookId,
    bookTitle: book.title,
    authorName: book.authorName,
    bookCover: book.coverImage,
    addedDate: "2026-07-02"
  };
  wishlists.unshift(newItem);
  res.status(201).json(newItem);
});

app.delete("/api/wishlist/:id", (req, res) => {
  const index = wishlists.findIndex(w => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Wishlist item not found" });
  wishlists.splice(index, 1);
  res.json({ message: "Item removed from wishlist" });
});

// ==========================================
// FINES PAYMENT
// ==========================================

app.get("/api/fines", (req, res) => {
  const { studentId } = req.query;
  calculateFines();
  let records = [...fines];
  if (studentId) {
    records = records.filter(f => f.studentId === studentId);
  }
  res.json(records);
});

app.post("/api/fines/pay/:id", (req, res) => {
  const fine = fines.find(f => f.id === req.params.id);
  if (!fine) return res.status(404).json({ message: "Fine record not found" });

  fine.status = "PAID";
  // Sync back to borrow record if outstanding
  const borrow = borrowRecords.find(b => b.id === fine.borrowId);
  if (borrow) {
    borrow.finePaid = true;
    borrow.fineAmount = 0;
  }

  addAuditLog(fine.studentId, "FINE_PAID", `Paid fine of ₹${fine.amount} for overdue book '${fine.bookTitle}'.`);
  res.json({ message: "Fine paid successfully.", fine });
});

// ==========================================
// NOTIFICATIONS
// ==========================================

app.get("/api/notifications", (req, res) => {
  const { userId } = req.query;
  let list = notifications.filter(n => n.userId === "ALL" || n.userId === userId);
  res.json(list);
});

app.patch("/api/notifications/:id/read", (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
  }
  res.json({ success: true });
});

// ==========================================
// AUDIT LOGS (ADMIN ONLY)
// ==========================================

app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

// ==========================================
// SYSTEM ANALYTICS & DASHBOARD METRICS
// ==========================================

app.get("/api/analytics", (req, res) => {
  calculateFines();
  const totalBooksCount = books.reduce((sum, b) => sum + b.quantity, 0);
  const totalUniqueBooks = books.length;
  const availableBooksCount = books.reduce((sum, b) => sum + b.availableCopies, 0);
  const issuedBooksCount = borrowRecords.filter(r => r.status === BorrowStatus.ISSUED || r.status === BorrowStatus.OVERDUE).length;
  const returnedBooksCount = borrowRecords.filter(r => r.status === BorrowStatus.RETURNED).length;

  const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
  const activeStudents = users.filter(u => u.role === UserRole.STUDENT && u.status === "ACTIVE").length;
  const overdueBooks = borrowRecords.filter(r => r.status === BorrowStatus.OVERDUE).length;
  const fineCollected = fines.filter(f => f.status === "PAID").reduce((sum, f) => sum + f.amount, 0);

  // Recharts Monthly stats
  const monthlyBorrowStats = [
    { name: "Jan", borrows: 12, returns: 10 },
    { name: "Feb", borrows: 19, returns: 15 },
    { name: "Mar", borrows: 25, returns: 22 },
    { name: "Apr", borrows: 34, returns: 29 },
    { name: "May", borrows: 42, returns: 35 },
    { name: "Jun", borrows: 55, returns: 48 },
    { name: "Jul", borrows: issuedBooksCount, returns: returnedBooksCount }
  ];

  // Category statistics
  const categoryWiseStats = categories.map(cat => {
    const count = books.filter(b => b.categoryId === cat.id).reduce((sum, b) => sum + b.quantity, 0);
    return { name: cat.name, value: count || 0 };
  });

  // Most Borrowed Books
  const mostBorrowedBooks = books.map(book => {
    const borrowCount = borrowRecords.filter(r => r.bookId === book.id).length;
    return { name: book.title, value: borrowCount || 1 }; // Default minimum of 1 for visual distribution
  }).sort((a, b) => b.value - a.value).slice(0, 4);

  // Student activity categories
  const studentActivity = [
    { name: "Active Borrowers", value: activeStudents },
    { name: "Inactive Borrowers", value: totalStudents - activeStudents }
  ];

  // Revenue from Fines
  const fineRevenueStats = [
    { name: "Collected", value: fineCollected },
    { name: "Pending", value: fines.filter(f => f.status === "UNPAID").reduce((sum, f) => sum + f.amount, 0) }
  ];

  res.json({
    cards: {
      totalBooks: totalBooksCount,
      uniqueBooks: totalUniqueBooks,
      availableBooks: availableBooksCount,
      issuedBooks: issuedBooksCount,
      returnedBooks: returnedBooksCount,
      totalStudents,
      activeStudents,
      overdueBooks,
      fineCollected
    },
    charts: {
      monthlyBorrowStats,
      categoryWiseStats,
      mostBorrowedBooks,
      studentActivity,
      fineRevenueStats
    }
  });
});

// ==========================================
// AI RECOMENDATION SYSTEM (GEMINI API INTEGRATION)
// ==========================================

app.get("/api/recommendations", async (req, res) => {
  const { studentId } = req.query;
  const student = users.find(u => u.id === studentId);
  if (!student) {
    return res.status(404).json({ message: "Student not found." });
  }

  // Gather student context
  const studentBorrows = borrowRecords.filter(r => r.studentId === studentId);
  const studentWishlist = wishlists.filter(w => w.studentId === studentId);
  const borrowTitles = studentBorrows.map(b => b.bookTitle).join(", ");
  const wishlistTitles = studentWishlist.map(w => w.bookTitle).join(", ");

  const systemContextPrompt = `
You are the AI Recommendation Engine for our Enterprise Library Management System.
We currently have the following books in our library system catalog:
${books.map(b => `- "${b.title}" by ${b.authorName} [Category: ${b.categoryName}, Subtitle: ${b.subtitle}, Description: ${b.description}]`).join("\n")}

Student Profile:
Name: ${student.fullName}
Department: ${student.department || "General"}
Books borrowed historically: ${borrowTitles || "None yet"}
Wishlist: ${wishlistTitles || "None yet"}

Generate EXACTLY 3 recommended book suggestions from our library catalog or similar topics that align with this student's interest.
Provide the output strictly as a JSON array with this structure:
[
  {
    "title": "Clean Code",
    "reason": "Because you have borrowed Effective Java and are in the Computer Science department, Mastering clean development principles will enhance your software engineering skills."
  },
  ...
]
Do not return any markdown wrappers like \`\`\`json, just return the plain JSON string array.
`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: systemContextPrompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "[]";
      const cleanedText = text.trim();
      const recommendations = JSON.parse(cleanedText);
      return res.json(recommendations);
    } else {
      throw new Error("Gemini AI Client not initialized.");
    }
  } catch (error) {
    console.warn("AI Recommendation Error (using mock backup recommendations):", error);
    // Fallback safe recommendations
    const mockRecs = [
      {
        title: "Clean Code",
        reason: "Recommended based on your interest in software development and structured practices."
      },
      {
        title: "Effective Java",
        reason: "Core programming best practices tailored to help you build highly scalable code architectures."
      },
      {
        title: "Refactoring",
        reason: "A must-read book to safely structure existing logic, highly recommended for your academic track."
      }
    ];
    res.json(mockRecs);
  }
});

// ==========================================
// VITE DEV SERVER OR STATIC SERVING
// ==========================================

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LMS SERVER] Full-stack server running at http://localhost:${PORT}`);
  });
}

start();
