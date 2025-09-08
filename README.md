# Polly - A Full-Stack Polling Application

<p align="center">
  <a href="https://nextjs.org" target="_blank">
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  </a>
  <a href="https://supabase.com" target="_blank">
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  </a>
  <a href="https://tailwindcss.com" target="_blank">
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  </a>
</p>

## Project Overview

Polly is a modern, full-stack polling application built with Next.js, Supabase, and Tailwind CSS. It allows users to create polls, share them with others, and view real-time results. This project serves as a comprehensive example of building a modern web application using a server-centric approach with the Next.js App Router and a powerful backend-as-a-service like Supabase.

### Key Features

-   **User Authentication**: Secure sign-up, login, and logout functionality powered by Supabase Auth.
-   **Poll Creation & Management**: Authenticated users can create, edit, and delete their own polls.
-   **Real-time Voting & Results**: Votes are cast in real-time, and results are updated live for all viewers.
-   **QR Code Sharing**: Easily share polls via a scannable QR code.
-   **Short Links**: Clean, shareable short links for every poll.
-   **Responsive Design**: A clean, modern UI that works on all devices, built with Tailwind CSS and shadcn/ui.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Backend & Database**: [Supabase](https://supabase.io/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
-   **Data Fetching**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
-   **Schema Validation**: [Zod](https://zod.dev/)
-   **Deployment**: [Vercel](https://vercel.com/)

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18.18 or newer)
-   npm, yarn, or pnpm
-   Git
-   A [Supabase](https://supabase.com/) account (the free tier is sufficient)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/alx-polly.git
    cd alx-polly
    ```

2.  **Install dependencies:**

    Choose your preferred package manager.

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up your Supabase project:**

    -   Go to [supabase.com](https://supabase.com/) and create a new project.
    -   Once your project is created, navigate to the **SQL Editor** in the dashboard sidebar.
    -   Copy the entire content of the `database/schema.sql` file from this repository.
    -   Paste the SQL into the editor and click **Run**. This will create the necessary tables (`polls`, `poll_options`, `votes`), views, and database functions.

4.  **Configure Environment Variables:**

    -   In your Supabase project dashboard, go to **Project Settings** > **API**.
    -   Find your **Project URL** and your `anon` `public` **Project API Key**.
    -   Create a new file named `.env.local` in the root of your local project.
    -   Add your Supabase credentials to the `.env.local` file:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

5.  **Run the development server:**

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Example Usage

1.  **Create an Account**: Navigate to the `/signup` page and create a new user account.
2.  **Create a Poll**: Once logged in, you will be redirected to the `/polls` dashboard. Click "Create New Poll".
3.  **Fill out the Form**: Enter your poll question and at least two options.
4.  **Share**: After creating the poll, you'll be taken to the poll page. You can share the URL directly or use the provided QR code for easy sharing.
5.  **Vote**: Anyone with the link can vote, and the results will update in real-time.

## How to Run Tests

This project uses Jest for testing. To run the test suite, use the following command:

```bash
npm run test
```

To run tests in watch mode:

```bash
npm run test:watch
```

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**. This project is designed to be approachable for new contributors.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

Please check the [open issues](https://github.com/najib-ab/alx-polly/issues) for a full list of proposed features (and known issues).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Before deploying, make sure to set the same environment variables in your Vercel project settings.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

Distributed under the MIT License. See `LICENSE` for more information.