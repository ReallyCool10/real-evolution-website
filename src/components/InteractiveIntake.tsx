import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const IntakeContainer = styled.div`
  max-width: 680px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2.5rem;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const HeaderArea = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
`;

const ProgressBar = styled.div<{ pct: number }>`
  height: 100%;
  width: ${props => props.pct}%;
  background: linear-gradient(90deg, hsl(46, 75%, 42%) 0%, hsl(46, 65%, 52%) 100%);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`;

const StepIndicator = styled.span`
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: hsl(46, 65%, 52%);
  font-weight: 600;
`;

const StepTitle = styled.h2`
  font-family: 'Outfit', sans-serif;
  font-size: 1.8rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0.5rem 0 0 0;

  @media (max-width: 480px) {
    font-size: 1.4rem;
  }
`;

const StepDescription = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0.5rem 0 0 0;
  line-height: 1.5;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin: 2rem 0;

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const SelectionCard = styled.button<{ selected: boolean }>`
  background: ${props => (props.selected ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.02)')};
  border: 1px solid ${props => (props.selected ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.08)')};
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);

  &:hover {
    transform: translateY(-2px);
    border-color: ${props => (props.selected ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.2)')};
    background: ${props => (props.selected ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.04)')};
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
  }

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.15rem;
    color: #ffffff;
    margin: 0;
    font-weight: 500;
  }

  p {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    line-height: 1.4;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 2rem 0;
`;

const Label = styled.label`
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  color: #ffffff;
  font-weight: 500;
  text-align: left;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    outline: none;
    border-color: hsl(46, 65%, 52%);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    outline: none;
    border-color: hsl(46, 65%, 52%);
    background: rgba(255, 255, 255, 0.08);
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
`;

const ActionButton = styled.button<{ secondary?: boolean }>`
  font-family: 'Outfit', sans-serif;
  padding: 0.85rem 1.75rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: ${props => (props.secondary ? '1px solid rgba(255, 255, 255, 0.2)' : 'none')};
  background: ${props => (props.secondary ? 'transparent' : 'hsl(46, 65%, 52%)')};
  color: ${props => (props.secondary ? '#ffffff' : '#0a0d14')};

  &:hover:not(:disabled) {
    background: ${props => (props.secondary ? 'rgba(255, 255, 255, 0.05)' : 'hsl(46, 75%, 42%)')};
    border-color: ${props => (props.secondary ? '#ffffff' : 'none')};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SuccessPanel = styled.div`
  text-align: center;
  padding: 2rem 0;
  animation: ${fadeIn} 0.5s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  svg {
    width: 64px;
    height: 64px;
    color: hsl(46, 65%, 52%);
    margin-bottom: 1rem;
  }
`;

export const InteractiveIntake: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
    message: '',
    // Step 2 conditional fields
    propertyType: '',
    propertyLocation: '',
    propertySize: '',
    investmentScale: '',
    investmentTimeline: '',
    interestArea: '',
    // Step 3 value drivers
    coreValue: '',
  });

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role,
      // reset conditional fields if role changes
      propertyType: '',
      propertyLocation: '',
      propertySize: '',
      investmentScale: '',
      investmentTimeline: '',
      interestArea: '',
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleValueSelect = (val: string) => {
    setFormData(prev => ({ ...prev, coreValue: val }));
  };

  const nextStep = () => {
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const isStepValid = () => {
    if (step === 1) return formData.role !== '';
    if (step === 2) {
      if (formData.role === 'owner') {
        return formData.propertyType !== '' && formData.propertyLocation !== '';
      }
      if (formData.role === 'investor') {
        return formData.investmentScale !== '' && formData.investmentTimeline !== '';
      }
      if (formData.role === 'advocate' || formData.role === 'seeker') {
        return formData.interestArea !== '';
      }
    }
    if (step === 3) return formData.coreValue !== '';
    if (step === 4) {
      return formData.name.trim() !== '' && formData.email.trim() !== '' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // Free Web3Forms submission API
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: 'YOUR_WEB3FORMS_ACCESS_KEY', // Customizable Form Key
          subject: `Real Evolution Advisor Intake: ${formData.role.toUpperCase()}`,
          from_name: 'Real Evolution Portal',
          ...formData
        })
      });

      if (response.ok) {
        setStep(5);
      } else {
        throw new Error('Server submission error');
      }
    } catch (err) {
      console.warn("Intake API delivery failed, triggering fallback mailto generator", err);
      // Fallback: Generate local mailto link so data is never lost
      const mailtoSubject = encodeURIComponent(`Real Evolution Portal Inquiry - ${formData.role}`);
      const mailtoBody = encodeURIComponent(
        `Real Evolution Intake Form Submission\n` +
        `====================================\n\n` +
        `Name: ${formData.name}\n` +
        `Email: ${formData.email}\n` +
        `Classification: ${formData.role.toUpperCase()}\n\n` +
        `Context Details:\n` +
        (formData.role === 'owner' ? `  - Asset Type: ${formData.propertyType}\n  - Location: ${formData.propertyLocation}\n  - Estimated Size: ${formData.propertySize}\n` : '') +
        (formData.role === 'investor' ? `  - Capital Scale: ${formData.investmentScale}\n  - Timeline: ${formData.investmentTimeline}\n` : '') +
        (formData.role === 'advocate' || formData.role === 'seeker' ? `  - Focus Area: ${formData.interestArea}\n` : '') +
        `\nPrimary Driver: ${formData.coreValue}\n\n` +
        `Message:\n${formData.message}\n`
      );
      
      const mailtoUrl = `mailto:evolution@real-evolution.com?subject=${mailtoSubject}&body=${mailtoBody}`;
      
      // Let the user send the email directly
      window.location.href = mailtoUrl;
      setStep(5); // Progress to success since user handles email dispatch
    } finally {
      setLoading(false);
    }
  };

  const getStepPercentage = () => {
    return ((step - 1) / 4) * 100;
  };

  return (
    <IntakeContainer>
      <HeaderArea>
        <ProgressTrack>
          <ProgressBar pct={getStepPercentage()} />
        </ProgressTrack>
        <StepIndicator>Step {step} of 4</StepIndicator>
        
        {step === 1 && (
          <>
            <StepTitle>Let's Align Your Purpose</StepTitle>
            <StepDescription>Choose the profile that matches your perspective. We tailor our academic modeling and strategy research to your specific challenges.</StepDescription>
          </>
        )}
        
        {step === 2 && formData.role === 'owner' && (
          <>
            <StepTitle>Feasibility & Spatial Modeling Parameters</StepTitle>
            <StepDescription>Tell us about your asset so we can run simulated volumetric floorplate audits and prior-approval feasibility checks.</StepDescription>
          </>
        )}

        {step === 2 && formData.role === 'investor' && (
          <>
            <StepTitle>Sponsorship Alignment</StepTitle>
            <StepDescription>We investigate spatial reconfigurations under Permitted Development Rights (PDR) to publish open-source policy blueprints.</StepDescription>
          </>
        )}

        {step === 2 && (formData.role === 'advocate' || formData.role === 'seeker') && (
          <>
            <StepTitle>Focus & Research Areas</StepTitle>
            <StepDescription>Select the core housing grid parameters and ONS macro-economic friction points you wish to study.</StepDescription>
          </>
        )}

        {step === 3 && (
          <>
            <StepTitle>What Drives You Most?</StepTitle>
            <StepDescription>Select the primary philosophy that guides your interest in evolving the built environment.</StepDescription>
          </>
        )}

        {step === 4 && (
          <>
            <StepTitle>Coalition Details</StepTitle>
            <StepDescription>Provide your details to align with our research team and participate in our strategic housing strategy publications.</StepDescription>
          </>
        )}

        {step === 5 && (
          <>
            <StepTitle>Intake Completed</StepTitle>
          </>
        )}
      </HeaderArea>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <CardGrid>
            <SelectionCard
              type="button"
              selected={formData.role === 'owner'}
              onClick={() => handleRoleSelect('owner')}
            >
              <h3>Asset Owner (Feasibility Study)</h3>
              <p>I want to test if underutilized assets or commercial spaces are viable for simulated volumetric grid layouts through a collaborative study.</p>
            </SelectionCard>

            <SelectionCard
              type="button"
              selected={formData.role === 'investor'}
              onClick={() => handleRoleSelect('investor')}
            >
              <h3>Strategic Strategy Sponsor</h3>
              <p>I want to sponsor academic research, macro modeling, and policy strategies to address the structural housing drag.</p>
            </SelectionCard>

            <SelectionCard
              type="button"
              selected={formData.role === 'seeker'}
              onClick={() => handleRoleSelect('seeker')}
            >
              <h3>Spatial Design Explorer</h3>
              <p>I want to review and analyze simulated volumetric layouts, space optimization metrics, and open-plan communal living formats.</p>
            </SelectionCard>

            <SelectionCard
              type="button"
              selected={formData.role === 'advocate'}
              onClick={() => handleRoleSelect('advocate')}
            >
              <h3>Policy / Academic Partner</h3>
              <p>I care about macroeconomic housing gaps (GDP stagnation, productivity traps, EPC failure) and want to co-author strategy papers.</p>
            </SelectionCard>
          </CardGrid>
        )}

        {step === 2 && formData.role === 'owner' && (
          <InputGroup>
            <div>
              <Label>Property / Asset Type *</Label>
              <TextInput
                type="text"
                name="propertyType"
                placeholder="e.g. Commercial Office Building, Retail, Outdated Residential, Land"
                value={formData.propertyType}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Asset Location *</Label>
              <TextInput
                type="text"
                name="propertyLocation"
                placeholder="e.g. Central Birmingham, East London, Bristol"
                value={formData.propertyLocation}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Approximate Size / Floors (Optional)</Label>
              <TextInput
                type="text"
                name="propertySize"
                placeholder="e.g. 15,000 sq ft / 3 floors"
                value={formData.propertySize}
                onChange={handleInputChange}
              />
            </div>
          </InputGroup>
        )}

        {step === 2 && formData.role === 'investor' && (
          <InputGroup>
            <div>
              <Label>Target Research Funding Scale *</Label>
              <TextInput
                type="text"
                name="investmentScale"
                placeholder="e.g. £5k - £25k, £25k - £100k, Corporate Sponsorship"
                value={formData.investmentScale}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Desired Publication Horizon *</Label>
              <TextInput
                type="text"
                name="investmentTimeline"
                placeholder="e.g. 3-6 months (Feasibility Paper), 12 months (Comprehensive Coalition Study)"
                value={formData.investmentTimeline}
                onChange={handleInputChange}
                required
              />
            </div>
          </InputGroup>
        )}

        {step === 2 && (formData.role === 'advocate' || formData.role === 'seeker') && (
          <InputGroup>
            <div>
              <Label>Select Core Area of Interest *</Label>
              <TextInput
                type="text"
                name="interestArea"
                placeholder="e.g. Office-to-Res Conversions, Energy Quality Gaps, GDP / Productivity"
                value={formData.interestArea}
                onChange={handleInputChange}
                required
              />
            </div>
          </InputGroup>
        )}

        {step === 3 && (
          <CardGrid>
            <SelectionCard
              type="button"
              selected={formData.coreValue === 'Social Impact'}
              onClick={() => handleValueSelect('Social Impact')}
            >
              <h3>Maximize Social Impact</h3>
              <p>Addressing the UK housing deficit and public energy crisis to support family well-being.</p>
            </SelectionCard>

            <SelectionCard
              type="button"
              selected={formData.coreValue === 'Asset Preservation'}
              onClick={() => handleValueSelect('Asset Preservation')}
            >
              <h3>Zoning & PDR Policy Evolution</h3>
              <p>Eliminating brownfield/greenfield sprawl by modeling the structural conversion of vacant office blocks under Prior Approval.</p>
            </SelectionCard>

            <SelectionCard
              type="button"
              selected={formData.coreValue === 'Architectural Excellence'}
              onClick={() => handleValueSelect('Architectural Excellence')}
            >
              <h3>Spatial & Design Quality</h3>
              <p>Replacing small sleeping quarters with massive, light-filled adaptive open communal spaces.</p>
            </SelectionCard>

            <SelectionCard
              type="button"
              selected={formData.coreValue === 'Financial Yields'}
              onClick={() => handleValueSelect('Financial Yields')}
            >
              <h3>Macro-Economic Resiliency</h3>
              <p>Investigating housing affordability growth vs stagnating wages as the primary bottleneck to UK national prosperity.</p>
            </SelectionCard>
          </CardGrid>
        )}

        {step === 4 && (
          <InputGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <Label>Your Name *</Label>
                <TextInput
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label>Email Address *</Label>
                <TextInput
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Additional Context / Message (Optional)</Label>
              <TextArea
                name="message"
                placeholder="Share any specific research areas, macro datasets, or structural feasibility queries..."
                value={formData.message}
                onChange={handleInputChange}
              />
            </div>
          </InputGroup>
        )}

        {step === 5 && (
          <SuccessPanel>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <StepTitle>Coalition Interest Registered</StepTitle>
            <StepDescription style={{ maxWidth: '400px' }}>
              Thank you for aligning with our housing research initiative. We have registered your selections, and our strategic team will contact you shortly to coordinate study collaboration.
            </StepDescription>
            <ActionButton type="button" onClick={() => setStep(1)} style={{ marginTop: '1.5rem' }}>
              Start New Consultation
            </ActionButton>
          </SuccessPanel>
        )}

        {errorMsg && <p style={{ color: 'red', textAlign: 'center' }}>{errorMsg}</p>}

        {step < 5 && (
          <ButtonRow>
            {step > 1 ? (
              <ActionButton type="button" onClick={prevStep} secondary>
                Back
              </ActionButton>
            ) : (
              <div /> // alignment placeholder
            )}

            {step < 4 ? (
              <ActionButton type="button" onClick={nextStep} disabled={!isStepValid()}>
                Next Step
              </ActionButton>
            ) : (
              <ActionButton type="submit" disabled={!isStepValid() || loading}>
                {loading ? 'Submitting...' : 'Submit Profile'}
              </ActionButton>
            )}
          </ButtonRow>
        )}
      </form>
    </IntakeContainer>
  );
};
