import { createGlobalStyle } from 'styled-components';

export const lightTheme = {
  body: '#F8F8F8',
  text: '#333333',
  headerBg: '#FFFFFF',
  headerText: '#333333',
  toggleBg: '#333333',
  toggleText: '#FFFFFF',
  chatBg: '#F0F0F0',
  userBubbleBg: '#E1F5FE',
  userBubbleText: '#01579B',
  userBubbleBorder: '#03A9F4',
  aiBubbleBg: '#F1F8E9',
  aiBubbleText: '#33691E',
  aiBubbleBorder: '#8BC34A',
  inputAreaBg: '#FFFFFF',
  inputBorder: '#E0E0E0',
  buttonBg: '#007AFF',
  buttonText: '#FFFFFF',
};

export const darkTheme = {
  body: '#1C1C1E',
  text: '#FFFFFF',
  headerBg: '#2C2C2E',
  headerText: '#FFFFFF',
  toggleBg: '#FFFFFF',
  toggleText: '#333333',
  chatBg: '#2C2C2E',
  userBubbleBg: '#01579B',
  userBubbleText: '#E1F5FE',
  userBubbleBorder: '#03A9F4',
  aiBubbleBg: '#33691E',
  aiBubbleText: '#F1F8E9',
  aiBubbleBorder: '#8BC34A',
  inputAreaBg: '#2C2C2E',
  inputBorder: '#3A3A3C',
  buttonBg: '#0A84FF',
  buttonText: '#FFFFFF',
  
};

export const GlobalStyles = createGlobalStyle`
  body {
    background-color: ${props => props.theme.body};
    color: ${props => props.theme.text};
    font-family: 'Arial', sans-serif;
    transition: all 0.3s linear;
  }
`;