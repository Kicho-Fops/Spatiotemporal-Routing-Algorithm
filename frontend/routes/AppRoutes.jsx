import { BrowserRouter, Route, Routes } from "react-router-dom";
import MapPage from "../src/pages/map";
import A from "../src/pages/A";


export default function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<A />} />
                <Route path="/map" element={<MapPage />} />
            </Routes>
        </BrowserRouter>
    );
}