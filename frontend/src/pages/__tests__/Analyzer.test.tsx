import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Analyzer from '../Analyzer';
import axios from 'axios';
import '@testing-library/jest-dom';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Analyzer Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders the analyzer form', () => {
    render(<Analyzer />);
    
    // Check if the main elements are rendered
    expect(screen.getByText('Webpage Analyzer')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze/i })).toBeInTheDocument();
  });

  test('shows error when URL is empty', () => {
    render(<Analyzer />);
    
    // Click the analyze button without entering a URL
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    fireEvent.click(analyzeButton);
    
    // Check if error message is shown
    expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
  });

  test('handles successful URL analysis', async () => {
    // Mock successful API response
    const mockResponse = {
      data: {
        url: 'https://example.com',
        title: 'Example Domain',
        content: 'This is an example domain',
        stats: {
          link_count: 5,
          image_count: 2,
          content_length: 100
        },
        sample_links: [
          { text: 'Example Link', href: 'https://example.com/link1' }
        ]
      }
    };
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse);
    
    render(<Analyzer />);
    
    // Enter URL and submit form
    const urlInput = screen.getByLabelText('Enter URL');
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(analyzeButton);
    
    // Check if loading state is shown
    expect(analyzeButton).toHaveTextContent('Analyzing...');
    
    // Wait for the API call to resolve
    await waitFor(() => {
      // Check if the results are displayed
      expect(screen.getByText('Example Domain')).toBeInTheDocument();
      expect(screen.getByText('5 links')).toBeInTheDocument();
      expect(screen.getByText('2 images')).toBeInTheDocument();
    });
  });

  test('handles API error', async () => {
    // Mock failed API response
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { detail: 'Invalid URL' },
        headers: {},
        statusText: 'Bad Request'
      }
    });
    
    render(<Analyzer />);
    
    // Enter URL and submit form
    const urlInput = screen.getByLabelText('Enter URL');
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    
    fireEvent.change(urlInput, { target: { value: 'invalid-url' } });
    fireEvent.click(analyzeButton);
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText(/Invalid URL or the server could not process the request/i)).toBeInTheDocument();
    });
  });
});
