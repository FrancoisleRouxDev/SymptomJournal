import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import OnboardingSlide1 from '@/app/onboarding/slide-1';
import OnboardingSlide2 from '@/app/onboarding/slide-2';
import OnboardingSlide3 from '@/app/onboarding/slide-3';

describe('Onboarding Slides', () => {
  it('renders Slide 1 with Droplet icon', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(<OnboardingSlide1 />);
    });
    expect(renderer!.root).toBeTruthy();
    const dropletIcon = renderer!.root.findByProps({ testID: 'lucide-Droplet' });
    expect(dropletIcon).toBeTruthy();
    expect(dropletIcon.props.size).toBe(36);
  });

  it('renders Slide 2 with icon', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(<OnboardingSlide2 />);
    });
    expect(renderer!.root).toBeTruthy();
    const icon =
      renderer!.root.findAllByProps({ testID: 'lucide-BrainCircuit' })[0] ||
      renderer!.root.findAllByProps({ testID: 'lucide-Activity' })[0];
    expect(icon).toBeTruthy();
    expect(icon.props.size).toBe(36);
  });

  it('renders Slide 3 with BriefcaseMedical icon', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    act(() => {
      renderer = ReactTestRenderer.create(<OnboardingSlide3 />);
    });
    expect(renderer!.root).toBeTruthy();
    const medicalIcon = renderer!.root.findByProps({ testID: 'lucide-BriefcaseMedical' });
    expect(medicalIcon).toBeTruthy();
    expect(medicalIcon.props.size).toBe(36);
  });
});
