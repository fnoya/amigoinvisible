# 🎁 Amigo Invisible (Secret Santa)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![MailerSend](https://img.shields.io/badge/MailerSend-0052CC?style=flat&logo=mail.ru&logoColor=white)](https://www.mailersend.com/)
[![Deploy](https://github.com/fnoya/amigoinvisible/actions/workflows/deploy.yml/badge.svg)](https://github.com/fnoya/amigoinvisible/actions/workflows/deploy.yml)

A complete Secret Santa ("Amigo Invisible") web application built with Firebase and MailerSend. Organize gift exchanges effortlessly with automatic random assignment and email notifications.

## ✨ Features

- 🔐 **User Authentication** - Secure login/registration with Firebase Auth
- 📝 **Event Management** - Create and manage multiple Secret Santa events
- 👥 **Participant Management** - Add, edit, and remove participants
- 🎲 **Random Assignment** - Automatic fair assignment algorithm
- 📧 **Email Notifications** - Automatic email delivery via MailerSend
- 📊 **Email Tracking** - Monitor delivery status and logs
- 🌐 **Responsive Design** - Works on desktop and mobile devices
- 🔧 **Development Mode** - Local testing with Firebase emulators

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- Firebase project with Authentication, Firestore, and Functions enabled
- [MailerSend](https://www.mailersend.com/) account and API key

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/amigo-invisible.git
   cd amigo-invisible
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configure environment variables**

   For security, Firebase configuration is not stored in the repository. Set these environment variables:

   ```bash
   export FIREBASE_API_KEY="your-api-key"
   export FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com" 
   export FIREBASE_PROJECT_ID="your-project-id"
   export FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
   export FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   export FIREBASE_APP_ID="your-app-id"
   ```

   Then generate the configuration file:

   ```bash
   ./build-config.sh
   ```

4. **Configure Firebase Functions environment**

   ```bash
   # Create .env file in functions directory
   echo "MAILERSEND_API_KEY=your_mailersend_api_key_here" > functions/.env
   ```

4. **Configure Firebase**
   - Update `public/index.html` with your Firebase configuration
   - Set up Firebase Functions config:

   ```bash
   firebase functions:config:set mailersend.api_key="your_api_key_here"
   ```

5. **Start development server**

   ```bash
   firebase emulators:start
   ```

## 🏗️ Project Structure

```txt
amigoinvisible/
├── functions/              # Cloud Functions
│   ├── index.js            # Main functions entry point
│   ├── events.js           # Event management functions
│   └── package.json        # Functions dependencies
├── public/                 # Frontend
│   └── index.html          # Single page application
├── firebase.json           # Firebase configuration
├── firestore.rules         # Security rules
├── firestore.indexes.json  # Database indexes
├── HUs.md                 # User stories
└── README.md              # This file
```

## 🎯 How It Works

1. **Create Event** - Set up a new Secret Santa event with details
2. **Add Participants** - Include names and emails of participants
3. **Execute Raffle** - Automatic random assignment ensuring no self-assignments
4. **Send Emails** - Participants receive their Secret Santa assignment via email

## 📧 Email Configuration

The application uses MailerSend for email delivery. You'll need:

1. A verified domain in MailerSend
2. An API key with send permissions
3. Update the `DEFAULT_FROM_EMAIL` in `functions/events.js`

### Webhook URL for tracking

```url
https://your-project-id.cloudfunctions.net/mailersendWebhook
```

## 🔧 Development

### Local Development with Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific services only
firebase emulators:start --only hosting,auth,firestore,functions
```

### Deployment

#### Manual Deployment

```bash
# Deploy everything
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting
```

#### Automatic Deployment (CI/CD)

This project includes GitHub Actions for automatic deployment:

- **Push to main**: Automatically deploys to production
- **Pull Requests**: Creates preview deployments and comments status

**Setup Required**:

1. Configure GitHub repository secrets (see [.github/DEPLOY_SETUP.md](.github/DEPLOY_SETUP.md))
2. Required secrets:
   - `FIREBASE_TOKEN` - Firebase CI token
   - `MAILERSEND_API_KEY` - MailerSend API key

Generate Firebase token:

```bash
firebase login:ci
```

## 🛡️ Security

- User authentication required for all operations
- Firestore security rules prevent unauthorized access
- Email addresses only visible to event organizer
- Assignment results protected and private

## 📱 User Interface

The application features a modern, responsive design with:

- Bootstrap 5 styling
- Font Awesome icons
- Progressive step indicators
- Real-time status updates
- Mobile-friendly interface

## 🔍 API Functions

| Function | Description |
|----------|-------------|
| `createEvent` | Create a new Secret Santa event |
| `getUserEvents` | Get all events for authenticated user |
| `addParticipant` | Add participant to an event |
| `getParticipants` | Get all participants for an event |
| `executeRaffle` | Perform random assignment |
| `sendSecretSantaEmails` | Send assignment emails |
| `getEmailLogs` | Get email delivery status |

## 🌍 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MAILERSEND_API_KEY` | MailerSend API key for email delivery | Yes |
| `NODE_ENV` | Environment (development/production) | No |

## 🧪 Testing

The application supports demo mode for development:

- When no valid MailerSend API key is provided, emails are simulated
- Firebase emulators allow local testing without affecting production data
- Console logging shows email content in development mode

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 User Stories

See [HUs.md](HUs.md) for detailed user stories and acceptance criteria.

## 🐛 Troubleshooting

### Common Issues

- **Email delivery fails**: Check MailerSend API key and domain verification
- **Authentication errors**: Verify Firebase configuration in `public/index.html`
- **Permission denied**: Ensure Firestore rules are properly deployed

### Debug Mode

Enable detailed logging by setting:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for the excellent backend-as-a-service platform
- MailerSend for reliable email delivery
- Bootstrap and Font Awesome for UI components

## 📞 Support

If you have any questions or need help, please:

1. Check the [troubleshooting section](#-troubleshooting)
2. Look through [existing issues](https://github.com/yourusername/amigo-invisible/issues)
3. Create a new issue with detailed information

---

Made with ❤️ for organizing better Secret Santa events

```bash

### Deploy a Firebase
```bash
npm run deploy
```

### Ver logs de Functions

```bash
firebase functions:log
```

## Estructura del proyecto

```bash
amigoinvisible/
├── functions/          # Cloud Functions
│   ├── index.js       # Funciones principales
│   ├── events.js      # Funciones de eventos
│   └── package.json   # Dependencias
├── public/            # Frontend
│   └── index.html     # Aplicación web
├── firebase.json      # Configuración Firebase
├── firestore.rules    # Reglas de seguridad
└── package.json       # Proyecto principal
```
