import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

export default function App() {
  // State for Users and Posts data
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  // Loading and feedback states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // User Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: ''
  });

  // Post Form State
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    author: ''
  });

  // Helper to show dismissible feedback
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev.message === message ? { type: '', message: '' } : prev));
    }, 6000);
  };

  // Fetch all users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      showFeedback('error', `Could not load users: ${err.message}. Ensure backend is running.`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch all posts with populated author details
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/posts`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      showFeedback('error', `Could not load posts: ${err.message}. Ensure backend is running.`);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchPosts();
  }, []);

  // Handle User Form submission
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      showFeedback('error', 'Please fill in both name and email.');
      return;
    }

    setSubmittingUser(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create user');
      }

      showFeedback('success', `User "${data.data.name}" created successfully!`);
      // Reset user form
      setUserForm({ name: '', email: '' });
      // Refresh users dropdown
      await fetchUsers();
      // Auto-select the newly created user in the post form
      if (data.data && data.data._id) {
        setPostForm((prev) => ({ ...prev, author: data.data._id }));
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSubmittingUser(false);
    }
  };

  // Handle Post Form submission
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.content.trim() || !postForm.author) {
      showFeedback('error', 'Please fill in Title, Content, and select an Author.');
      return;
    }

    setSubmittingPost(true);
    try {
      const res = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postForm)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to publish post');
      }

      showFeedback('success', `Post "${data.data.title}" published with author populated!`);
      // Reset post fields except author selection for convenience
      setPostForm((prev) => ({ ...prev, title: '', content: '' }));
      // Automatically refresh posts list to display newly created post
      await fetchPosts();
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setSubmittingPost(false);
    }
  };

  return (
    <div className="container">
      {/* App Header */}
      <header className="app-header">
        <h1>MERN Referencing & Populate Demo</h1>
        <p>Demonstrating normalized MongoDB document relations via Mongoose ObjectId & .populate()</p>
        <div className="badge-status">
          <span className="status-dot"></span>
          Backend API: {API_BASE_URL}
        </div>
      </header>

      {/* Global Feedback Banner */}
      {feedback.message && (
        <div className={`alert-banner ${feedback.type}`}>
          <span>{feedback.message}</span>
          <button className="alert-close" onClick={() => setFeedback({ type: '', message: '' })}>
            &times;
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column: Forms */}
        <div className="forms-stack">
          {/* Form 1: Create User */}
          <div className="card">
            <h2 className="card-title">
              <span className="icon">&#128100;</span> 1. Create User (Author)
            </h2>
            <form onSubmit={handleUserSubmit}>
              <div className="form-group">
                <label htmlFor="user-name">Full Name</label>
                <input
                  id="user-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. John Doe"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="user-email">Email Address</label>
                <input
                  id="user-email"
                  type="email"
                  className="form-control"
                  placeholder="e.g. john@example.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submittingUser}>
                {submittingUser ? 'Saving User...' : 'Create User'}
              </button>
            </form>
          </div>

          {/* Form 2: Create Post */}
          <div className="card">
            <h2 className="card-title">
              <span className="icon">&#9997;</span> 2. Create Post Linked to Author
            </h2>
            <form onSubmit={handlePostSubmit}>
              <div className="form-group">
                <label htmlFor="post-title">Post Title</label>
                <input
                  id="post-title"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mastering Mongoose .populate()"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="post-author">Select Author (User _id)</label>
                <select
                  id="post-author"
                  className="form-control"
                  value={postForm.author}
                  onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                  required
                >
                  <option value="">
                    {loadingUsers ? 'Loading authors...' : '-- Select Author --'}
                  </option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
                {users.length === 0 && !loadingUsers && (
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                    * Create a user above first to populate this dropdown.
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="post-content">Post Content</label>
                <textarea
                  id="post-content"
                  className="form-control"
                  placeholder="Write the post content here..."
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                disabled={submittingPost || users.length === 0}
              >
                {submittingPost ? 'Publishing...' : 'Publish Post'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Populated Posts Display */}
        <div className="card">
          <div className="posts-header">
            <h2 className="card-title" style={{ border: 'none', margin: 0, padding: 0 }}>
              <span className="icon">&#128214;</span> 3. Populated Posts Stream ({posts.length})
            </h2>
            <button
              className="refresh-btn"
              onClick={() => {
                fetchPosts();
                fetchUsers();
              }}
              title="Refresh Data"
            >
              &#x21bb; Refresh
            </button>
          </div>

          {loadingPosts && posts.length === 0 ? (
            <div className="empty-state">
              <p>Loading posts and resolving author references...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <h3>No posts published yet</h3>
              <p>Add a user, select them as the author, and create your first post!</p>
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <article key={post._id} className="post-card">
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-content">{post.content}</p>

                  <div className="post-meta">
                    <div className="author-pill">
                      <div className="author-avatar">
                        {post.author?.name ? post.author.name.charAt(0) : '?'}
                      </div>
                      <span className="author-name">
                        {post.author ? post.author.name : 'Unknown Author'}
                      </span>
                      {post.author?.email && (
                        <span className="author-email">&lt;{post.author.email}&gt;</span>
                      )}
                    </div>

                    <span className="post-date">
                      {new Date(post.createdAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
