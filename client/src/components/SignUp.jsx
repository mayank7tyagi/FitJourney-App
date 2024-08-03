import React from "react";
import styled from "styled-components";
import TextInput from "./TextInput";
import Button from "./Button";

const Container = styled.div`
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    gap: 36px;
`;
const Title = styled.div`
    font-size: 30px;
    font-weight: 800;
    color: ${({ theme } ) => theme.primary};
`;
const Span = styled.div`
    font-size: 16px;
    font-weight: 400;
     color: ${({ theme } ) => theme.secondary};
`;

const SignUp = () => {
    return(
        <div>
            <Container>
                <div>
                    <Title>Create new Account</Title>
                    <Span>Please enter your details to create a new account.</Span>
                </div>
                <div style={{display: "flex" , gap: "20px" , flexDirection: "column"}}>
                    <TextInput 
                    label="Full Name"
                    placeholder="Enter your Full Name" />
                    <TextInput 
                    label=" Email Address"
                    placeholder="Enter your email address" />
                    <TextInput 
                    label=" Password "
                    placeholder="Enter your password"
                    password />
                    <Button text = "SignIn"/>

                </div>
            </Container>
        </div>
    );
}
export default SignUp;