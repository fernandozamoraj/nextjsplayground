import React, { useEffect, useState } from "react";
import NumericInput from 'react-numeric-input';

const Cell = ({row, column, val, updateBoard}) =>{

    const [cellWidth, setCellwidth] = useState(100);
    const [innerWidth, setInnerWidth] = useState(800);
    let padding = 0;

    if(((column+1)%3) == 0){
        padding = 25;
    }

    useEffect( ()=>{

        function handleResize(){
            let cellWidth = 100;
            if(window.innerWidth < 400){
                cellWidth = 30;
            }
            else if(window.innerWidth < 1200){
                cellWidth = 50;
            }
    
            setCellwidth(cellWidth);
            setInnerWidth(window.innerWidth);
        }

        window.addEventListener('resize', handleResize);
    });

   
    if(cellWidth < 50){
        return (
            <div>
                {"Device too small... rotate it or use iPad mini or larger...sorry."}
            </div>
           );
    }


    return (
        <div key={`board-element-${row}-${column}`} className={`col-1`} style={{width: cellWidth, padding: 0, marginRight: padding}}>
            <NumericInput 
                style={false} 
                type="text" 
                className="form-control" 
                id={`board-${row}-${column}`} 
                key={`board-${row}-${column}`} 
                placeholder="0" 
                value={val}
                onChange={ value => updateBoard(row, column, value)}
                />
        </div>
    );
}


export default Cell;