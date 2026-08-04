# ☕ BrewNet Cafe

BrewNet Cafe is a QR-based smart cafe ordering and real-time order management web application designed to simplify the ordering experience for customers and cafe staff.

Customers can scan a table QR code, browse the digital menu, place orders, track their order status in real time, and view their previous orders. Staff members can manage incoming orders through a dedicated Barista Board.

## 🚀 Live Demo

https://brewnet-cafe.vercel.app

## 📸 Project Screenshots

### 🏠 Customer Menu
![BrewNet Cafe Customer Menu](Screenshot%202026-08-03%20233654.png)

### 👨‍🍳 Barista Board
![BrewNet Cafe Barista Board](Screenshot%202026-08-04%20123422.png)

### 📱 Real-Time Order Tracking
![BrewNet Cafe Order Tracking](Screenshot%202026-08-04%20123729.png)

### 📲 Table QR Ordering
![BrewNet Cafe Table QR](Screenshot%202026-08-04%20123851.png)


## ✨ Features

- 📱 QR-based table ordering
- 🔐 Google authentication
- 👤 Customer and Staff role-based access
- 🛒 Digital menu and shopping cart
- 💳 Multiple payment-method interface
- 💵 Cash-at-counter ordering
- 🔥 Real-time order storage using Cloud Firestore
- 👨‍🍳 Dedicated Barista Board
- 🔄 Real-time order status updates
- ✅ Received → Preparing → Ready → Completed workflow
- 📜 Customer Past Orders
- 🔁 Re-order previous items
- 🎁 Customer reward points
- 📱 Responsive mobile and desktop interface

## 🔄 How It Works

1. Customer scans the QR code assigned to a cafe table.
2. BrewNet Cafe opens with the table number automatically selected.
3. Customer browses the menu and adds items to the cart.
4. Customer places the order.
5. The order appears on the staff Barista Board.
6. Staff updates the order through:
   Received → Preparing → Ready → Completed
7. The customer sees these status changes in real time.
8. Completed orders are available under Past Orders.

## 🛠️ Tech Stack

- React
- TypeScript
- Vite
- Firebase Authentication
- Cloud Firestore
- Firebase Security Rules
- Vercel
- Google AI Studio

## 🔐 Authentication & Security

BrewNet Cafe uses Firebase Authentication for user sign-in and Firestore security rules for role-based access.

Users can have roles such as:

- customer
- staff

Staff-only functionality such as the Barista Board is protected from normal customer accounts.

## 🗄️ Database

Cloud Firestore is used to store and synchronize:

- Menu items
- User profiles
- User roles
- Orders
- Order status
- Reward points
- Order history

Firestore's real-time capabilities allow order-status changes made by staff to appear on the customer's device.

## 📱 Example Workflow

Customer Phone  
↓  
Scan Table QR  
↓  
Browse Menu  
↓  
Place Order  
↓  
Cloud Firestore  
↓  
Barista Board  
↓  
Preparing → Ready → Completed  
↓  
Customer receives real-time updates

## 🎯 Project Goal

The goal of BrewNet Cafe is to demonstrate how a modern web application can improve cafe operations by combining QR ordering, real-time database synchronization, authentication, and role-based order management.

## 👨‍💻 Developer

Developed by *Preetham MK*

This project was created as a learning project to gain practical experience with modern web development, Firebase, real-time databases, authentication, deployment, and AI-assisted development.
