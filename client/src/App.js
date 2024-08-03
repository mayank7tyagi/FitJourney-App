import {ThemeProvider , styled} from "styled-components";
import {lightTheme} from "./utils/Themes";
import { BrowserRouter , Route , Routes } from "react-router-dom";
import Authentication from "./pages/Authentication";
import { useSelector } from "react-redux";
import { useState } from "react";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Workouts from "./pages/Workouts";

let Container = styled.div`
width: 100%;
height: 100vh;
display: flex;
flex-direction: column;
background: ${({ theme }) => theme.bg};
color: ${({ theme } ) => theme.text_primary};
overflow-x: hidden;
overflow-y: hidden;
transition: all 0. 2s ease;
`;
function App(){

    const { currentUser } = useSelector((state) => state.user);
    return(
        <ThemeProvider theme ={lightTheme}>
            <BrowserRouter>
            {currentUser ? (
                <Container>
                    <NavBar currentUser ={currentUser}/>
                    <Routes>
                        <Route path ="/" exact element ={<Dashboard />} />
                        <Route path ="/workouts" exact element ={<Workouts />} />

                    </Routes>
                </Container>
            ) : (
                <Container>
                    <Authentication/>
                </Container>
            )}
                
            </BrowserRouter>
        </ThemeProvider>
    );
}
export default App;