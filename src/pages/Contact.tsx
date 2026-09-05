import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Free tier form-delivery service (web3forms.com).
const WEB3FORMS_ACCESS_KEY = '9a59263f-78ba-47e0-8dd9-118db4e9a011';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ContactContainer = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 1rem 2rem;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

const HeaderSection = styled.div`
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 1.5rem;
  margin-bottom: 2.5rem;

  span {
    font-family: 'Outfit', sans-serif;
    font-size: 0.85rem;
    text-transform: uppercase;
    color: hsl(46, 65%, 52%);
    letter-spacing: 2px;
    font-weight: 600;
  }

  h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 2.5rem;
    color: #ffffff;
    font-weight: 500;
    margin: 0.5rem 0 0 0;
  }

  p {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.7;
    margin: 1rem 0 0 0;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
`;

const inputStyles = `
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 0.85rem 1rem;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: hsl(46, 65%, 52%);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }
`;

const Input = styled.input`
  ${inputStyles}
`;

const TextArea = styled.textarea`
  ${inputStyles}
  resize: vertical;
  min-height: 140px;
  font-family: 'Inter', sans-serif;
`;

const SubmitButton = styled.button`
  font-family: 'Outfit', sans-serif;
  background: hsl(46, 65%, 52%);
  border: none;
  color: hsl(220, 38%, 7%);
  padding: 0.9rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;

  &:hover:not(:disabled) {
    background: hsl(46, 75%, 58%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.p<{ variant: 'success' | 'error' }>`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: ${props => (props.variant === 'success' ? 'hsl(46, 65%, 52%)' : '#f43f5e')};
  margin: 0;
`;

type Status = 'idle' | 'sending' | 'success' | 'error';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const isValid = name.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && message.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || status === 'sending') return;

    setStatus('sending');

    try {
      // FormData (not JSON) avoids a CORS preflight that Web3Forms' API doesn't handle.
      const formData = new FormData();
      formData.append('access_key', WEB3FORMS_ACCESS_KEY);
      formData.append('subject', `Real Evolution website enquiry from ${name}`);
      formData.append('from_name', 'Real Evolution Website');
      formData.append('name', name);
      formData.append('email', email);
      formData.append('message', message);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Submission failed');
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.warn('Contact form delivery failed, falling back to mailto', err);
      const subject = encodeURIComponent(`Real Evolution website enquiry from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:info@realevolution.co.uk?subject=${subject}&body=${body}`;
      setStatus('error');
    }
  };

  return (
    <ContactContainer>
      <HeaderSection>
        <h2>Contact Us</h2>
        <p>
          Whether you're a property owner, investor, researcher, or just have a question about our work,
          we'd like to hear from you.
        </p>
      </HeaderSection>

      <Form onSubmit={handleSubmit}>
        <Field>
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field>
          <Label htmlFor="contact-message">Message</Label>
          <TextArea
            id="contact-message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Tell us a bit about why you're getting in touch..."
            required
          />
        </Field>

        <SubmitButton type="submit" disabled={!isValid || status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send Message'}
        </SubmitButton>

        {status === 'success' && (
          <StatusMessage variant="success">Thanks - your message has been sent. We'll be in touch soon.</StatusMessage>
        )}
        {status === 'error' && (
          <StatusMessage variant="error">
            We couldn't send that automatically, so we've opened your email client instead - please send the pre-filled message to reach us.
          </StatusMessage>
        )}
      </Form>
    </ContactContainer>
  );
};

export default Contact;
