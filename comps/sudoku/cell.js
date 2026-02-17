import React, { useEffect, useState } from "react";

const Cell = ({row, column, val, updateBoard}) =>{

    const [cellWidth, setCellwidth] = useState(66);
    const [innerWidth, setInnerWidth] = useState(800);
    let padding = 0;

    if(((column+1)%3) == 0){
        padding = 25;
    }

    useEffect( ()=>{

        function handleResize(){
            let cellWidth = 66;
            if(window.innerWidth < 400){
                cellWidth = 20;
            }
            else if(window.innerWidth < 1200){
                cellWidth = 34;
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


    const handleChange = (event) => {
        const raw = event.target.value.replace(/\D/g, '').slice(0, 2);
        const parsedValue = raw === '' ? 0 : Number.parseInt(raw, 10);
        updateBoard(row, column, parsedValue);
    };

    const borderStyle = {
        borderTop: row % 3 === 0 ? '3px solid #1f2937' : '1px solid #cbd5f5',
        borderLeft: column % 3 === 0 ? '3px solid #1f2937' : '1px solid #cbd5f5',
        borderRight: column % 3 === 2 ? '3px solid #1f2937' : '1px solid #cbd5f5',
        borderBottom: row % 3 === 2 ? '3px solid #1f2937' : '1px solid #cbd5f5'
    };

    return (
        <div
            key={`board-element-${row}-${column}`}
            className={`col-1`}
            style={{
                width: cellWidth,
                height: cellWidth,
                padding: 0,
                marginRight: padding
            }}
        >
            <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={2}
                className="form-control"
                id={`board-${row}-${column}`}
                placeholder="0"
                value={val === 0 ? '' : val}
                onChange={handleChange}
                style={{
                    width: cellWidth,
                    height: cellWidth,
                    textAlign: 'center',
                    fontSize: Math.max(Math.floor(cellWidth * 0.6), 18),
                    padding: 0,
                    borderRadius: 0,
                    ...borderStyle
                }}
            />
        </div>
    );
}


export default Cell;